import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map.js';
import { unByKey } from 'ol/Observable.js';
import View from 'ol/View.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import type Feature from 'ol/Feature.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { defaults as defaultInteractions } from 'ol/interaction/defaults.js';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom.js';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';
import type { StyleFunction } from 'ol/style/Style.js';
import { createEmpty, extend, isEmpty } from 'ol/extent.js';
import type { Extent } from 'ol/extent.js';
import 'ol/ol.css';
import { hasSpeciesSpecificEvidence } from './geography-view-state';

interface RangeLayer {
  id: string;
  layerType: string;
  geometryAssetId?: string;
  geometryFeatureCount?: number;
  summary: string;
}

interface DistributionRecord {
  speciesId: string;
  regionId: string;
  countryCode: string;
  regionName: string;
  distributionStatus: 'native' | 'introduced' | 'uncertain' | 'recorded_presence';
}

interface OccurrenceHover {
  x: number;
  y: number;
  recordedDate: string;
  dataset: string;
  basis: string;
}

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
const assetPath = (path: string): string => `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

const colorForLayer = (layerType: string): string => {
  if (layerType === 'marine_evidence_cell') {
    return '#4d9fca';
  }
  if (layerType === 'native' || layerType === 'native_range') {
    return '#54b783';
  }
  if (layerType === 'introduced' || layerType === 'introduced_range') {
    return '#e3a64b';
  }
  if (layerType === 'uncertain' || layerType === 'uncertain_range') {
    return '#b89be8';
  }
  return '#f4b942';
};

const styleForLayer = (layerType: string): Style => {
  const color = colorForLayer(layerType);
  return new Style({
    fill: new Fill({ color: `${color}66` }),
    stroke: new Stroke({ color, width: 1.5 }),
    image: new CircleStyle({
      radius: 5,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: '#101817', width: 1.2 }),
    }),
  });
};

const styleForAllRegionsGlobal = new Style({
  fill: new Fill({ color: '#71827d22' }),
  stroke: new Stroke({ color: '#71827d22', width: 0.45 }),
});

const styleForAllRegionsDetail = new Style({
  fill: new Fill({ color: '#71827d22' }),
  stroke: new Stroke({ color: '#71827d55', width: 0.55 }),
});

const styleForAllRegions: StyleFunction = (_feature, resolution) => {
  return resolution > 12000 ? styleForAllRegionsGlobal : styleForAllRegionsDetail;
};

const styleForNationalBorders = new Style({
  fill: new Fill({ color: '#00000000' }),
  stroke: new Stroke({ color: '#d5dfd9cc', width: 1.6 }),
});

const styleForMarineLandmasses = new Style({
  fill: new Fill({ color: '#71827d44' }),
  stroke: new Stroke({ color: '#71827d88', width: 0.7 }),
});

const formatOccurrenceDate = (feature: Feature): string => {
  const eventDate = feature.get('eventDate');
  if (typeof eventDate === 'string' && eventDate.length > 0) return eventDate;
  const year = feature.get('year');
  const month = feature.get('month');
  const day = feature.get('day');
  if (typeof year !== 'number') return 'Date not provided';
  return [year, month, day].filter((value) => typeof value === 'number').join('-');
};

export const OpenLayersGeographyMap = ({
  ranges,
  speciesId,
  geographyKind = 'terrestrial',
}: {
  ranges: RangeLayer[];
  speciesId?: string;
  geographyKind?: 'terrestrial' | 'marine';
}) => {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const rangeLayersRef = useRef<Record<string, VectorLayer<VectorSource<Feature>>> >({});
  const wheelZoomActiveRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wheelZoomActive, setWheelZoomActive] = useState(false);
  const [adminLayerTypes, setAdminLayerTypes] = useState<string[]>([]);
  const [hasSpeciesEvidence, setHasSpeciesEvidence] = useState(false);
  const [hoveredOccurrence, setHoveredOccurrence] = useState<OccurrenceHover | null>(null);

  useEffect(() => {
    const mapElement = mapElementRef.current;
    if (!mapElement) {
      setError('The map container could not be initialized.');
      setLoading(false);
      return undefined;
    }

    let disposed = false;
    setLoading(true);
    setError(null);
    setAdminLayerTypes([]);
    setHasSpeciesEvidence(false);
    setHoveredOccurrence(null);
    const map = new Map({
      target: mapElement,
      interactions: defaultInteractions({ mouseWheelZoom: false }),
      view: new View({
        projection: 'EPSG:3857',
        center: [0, 0],
        zoom: 2,
        minZoom: 0,
        maxZoom: 8,
      }),
    });
    mapRef.current = map;
    const activateWheelZoom = (): void => {
      if (!wheelZoomActiveRef.current) {
        wheelZoomActiveRef.current = true;
        map.addInteraction(new MouseWheelZoom());
        setWheelZoomActive(true);
      }
    };
    mapElement.addEventListener('click', activateWheelZoom);
    const deactivateWheelZoom = (event: PointerEvent): void => {
      if (event.target instanceof Node && !mapElement.contains(event.target)) {
        if (wheelZoomActiveRef.current) {
          const wheelZoom = map.getInteractions().getArray().find((interaction) => interaction instanceof MouseWheelZoom);
          if (wheelZoom) {
            map.removeInteraction(wheelZoom);
          }
          wheelZoomActiveRef.current = false;
          setWheelZoomActive(false);
        }
      }
    };
    document.addEventListener('pointerdown', deactivateWheelZoom);
    const pointerMoveKey = map.on('pointermove', (event) => {
      let occurrenceFeature: Feature | undefined;
      map.forEachFeatureAtPixel(event.pixel, (feature) => {
        const candidate = feature as Feature;
        if (candidate.get('occurrenceID')) {
          occurrenceFeature = candidate;
          return true;
        }
        return false;
      });
      if (!occurrenceFeature) {
        setHoveredOccurrence(null);
        return;
      }
      setHoveredOccurrence({
        x: event.pixel[0],
        y: event.pixel[1],
        recordedDate: formatOccurrenceDate(occurrenceFeature),
        dataset: String(occurrenceFeature.get('datasetTitle') || 'Dataset not provided'),
        basis: String(occurrenceFeature.get('basisOfRecord') || 'Record basis not provided'),
      });
    });
    const handlePointerLeave = (): void => setHoveredOccurrence(null);
    mapElement.addEventListener('pointerleave', handlePointerLeave);

    const load = async (): Promise<void> => {
      try {
        const extent: Extent = createEmpty();
        let registryRecordCount = 0;
        let mappedRangeEvidenceCount = 0;
        const boundaryResponse = await fetch(assetPath('/geography/admin1/national-boundaries.geojson'));
        if (!boundaryResponse.ok) {
          throw new Error('The local global administrative boundary layer could not be loaded.');
        }
        const overviewFeatures = new GeoJSON().readFeatures(await boundaryResponse.json(), {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857',
        }).filter((feature) => feature.get('shapeGroup') !== 'ATA');

        if (geographyKind === 'marine') {
          const landmassLayer = new VectorLayer({
            source: new VectorSource({ features: overviewFeatures }),
            style: styleForMarineLandmasses,
            properties: { label: 'landmasses' },
          });
          landmassLayer.setZIndex(20);
          map.addLayer(landmassLayer);
        }

        if (speciesId && geographyKind === 'terrestrial') {
          const registryResponse = await fetch(assetPath('/data/geography/distribution-registry.json'));
          if (!registryResponse.ok) {
            throw new Error('The local distribution registry could not be loaded.');
          }
          
          const registry = (await registryResponse.json()) as { records: DistributionRecord[] };
          const records = registry.records.filter((record) => record.speciesId === speciesId);
          registryRecordCount = records.length;
          const regionIds = new Set(records.map((record) => record.regionId));
          const statusesByRegion = new globalThis.Map<string, DistributionRecord['distributionStatus']>();
          records.forEach((record) => statusesByRegion.set(record.regionId, record.distributionStatus));
          const featuresByStatus = new globalThis.Map<string, Feature[]>();
          const allRegionsSource = new VectorSource({ features: overviewFeatures });
          const allRegionsLayer = new VectorLayer({
            source: allRegionsSource,
            style: styleForAllRegions,
            properties: { label: 'all administrative regions' },
          });
          rangeLayersRef.current.adminAll = allRegionsLayer;
          map.addLayer(allRegionsLayer);
          const allRegionsExtent = allRegionsSource.getExtent();
          if (allRegionsExtent) {
            extend(extent, allRegionsExtent);
          }

          const nationalBoundarySource = new VectorSource({ features: overviewFeatures.map((feature) => feature.clone()) });
          const nationalBoundaryLayer = new VectorLayer({
            source: nationalBoundarySource,
            style: styleForNationalBorders,
            properties: { label: 'national borders' },
          });
          rangeLayersRef.current.nationalBorders = nationalBoundaryLayer;
          map.addLayer(nationalBoundaryLayer);

          let detailedAdminLoaded = false;
          const loadDetailedAdmin = async (): Promise<void> => {
            if (detailedAdminLoaded) return;
            detailedAdminLoaded = true;
            const detailedResponse = await fetch(assetPath('/geography/admin1/global.geojson'));
            if (!detailedResponse.ok) {
              throw new Error('The detailed local administrative boundary layer could not be loaded.');
            }
            const detailedFeatures = new GeoJSON().readFeatures(await detailedResponse.json(), {
              dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:3857',
            }).filter((feature) => feature.get('shapeGroup') !== 'ATA');
            allRegionsLayer.setSource(new VectorSource({ features: detailedFeatures }));
            for (const feature of detailedFeatures) {
              const regionId = `${feature.get('shapeGroup')}-${feature.get('shapeISO')}`;
              if (regionIds.has(regionId)) {
                const status = statusesByRegion.get(regionId) ?? 'recorded_presence';
                const statusFeatures = featuresByStatus.get(status) ?? [];
                statusFeatures.push(feature.clone());
                featuresByStatus.set(status, statusFeatures);
              }
            }
            for (const [status, statusFeatures] of featuresByStatus) {
              const adminSource = new VectorSource({ features: statusFeatures });
              const adminLayer = new VectorLayer({
                source: adminSource,
                style: styleForLayer(status),
                properties: { label: `${status} regions` },
              });
              rangeLayersRef.current[`admin-${status}`] = adminLayer;
              map.addLayer(adminLayer);
            }
            setAdminLayerTypes([...featuresByStatus.keys()]);
          };
          map.on('moveend', () => {
            if ((map.getView().getZoom() ?? 0) >= 3) {
              void loadDetailedAdmin().catch((loadError) => {
                if (!disposed) setError((loadError as Error).message);
              });
            }
          });
          void loadDetailedAdmin().catch((loadError) => {
            if (!disposed) setError((loadError as Error).message);
          });
        }

        const mappedRanges = ranges.filter((range) => range.geometryAssetId);
        const rangeResponses = await Promise.all(
          mappedRanges.map((range) => fetch(assetPath(range.geometryAssetId as string))),
        );
        if (rangeResponses.some((response) => !response.ok)) {
          throw new Error('A local geography layer could not be loaded.');
        }

        for (const [index, range] of mappedRanges.entries()) {
          const data = await rangeResponses[index].json();
          const source = new VectorSource({
            features: new GeoJSON().readFeatures(data, {
              dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:3857',
            }),
          });
          const layer = new VectorLayer({
            source,
            style: styleForLayer(range.layerType),
            properties: { label: range.layerType },
          });
          layer.setZIndex(range.layerType === 'marine_evidence_cell' ? 10 : 30);
          rangeLayersRef.current[range.id] = layer;
          map.addLayer(layer);
          if (source.getFeatures().length > 0) {
            mappedRangeEvidenceCount += 1;
          }
          const sourceExtent = source.getExtent();
          if (sourceExtent) {
            extend(extent, sourceExtent);
          }
        }

        if (!disposed) {
          setHasSpeciesEvidence(hasSpeciesSpecificEvidence({
            registryRecordCount,
            mappedRangeCount: mappedRangeEvidenceCount,
          }));
          if (!isEmpty(extent)) {
            map.getView().fit(extent, {
              padding: [24, 24, 24, 24],
              maxZoom: 6,
              duration: 0,
            });
          }
          setLoading(false);
        }
      } catch (loadError) {
        if (!disposed) {
          setError((loadError as Error).message);
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      disposed = true;
      rangeLayersRef.current = {};
      wheelZoomActiveRef.current = false;
      mapElement.removeEventListener('click', activateWheelZoom);
      mapElement.removeEventListener('pointerleave', handlePointerLeave);
      document.removeEventListener('pointerdown', deactivateWheelZoom);
      unByKey(pointerMoveKey);
      map.setTarget(undefined);
      map.dispose();
      mapRef.current = null;
    };
  }, [ranges, speciesId, geographyKind]);

  return (
    <div className="openlayers-geography-map" aria-label="Interactive geographic distribution map">
      <div ref={mapElementRef} className="openlayers-geography-map-canvas" />
      {hoveredOccurrence ? (
        <div
          className="openlayers-geography-map-tooltip"
          role="tooltip"
          style={{ left: hoveredOccurrence.x, top: hoveredOccurrence.y }}
        >
          <strong>Occurrence record</strong>
          <span>Recorded: {hoveredOccurrence.recordedDate}</span>
          <span>Dataset: {hoveredOccurrence.dataset}</span>
          <span>Basis: {hoveredOccurrence.basis}</span>
        </div>
      ) : null}
      {loading ? <p className="openlayers-geography-map-status">Loading local geography layers...</p> : null}
      {error ? <p className="openlayers-geography-map-status" role="alert">{error}</p> : null}
      {!loading && !error && !hasSpeciesEvidence ? (
        <p className="openlayers-geography-map-status">No species-specific geography evidence is available; neutral administrative boundaries are shown.</p>
      ) : null}
      {!loading && !error && !wheelZoomActive ? (
        <p className="openlayers-geography-map-zoom-hint">Click the map to enable scroll zoom.</p>
      ) : null}
      <div className="openlayers-geography-map-controls" aria-label="Geography layers">
        {geographyKind === 'terrestrial' && <>
        <label>
          <input
            type="checkbox"
            defaultChecked
            onChange={(event) => rangeLayersRef.current.adminAll?.setVisible(event.target.checked)}
          />
          <span className="geography-layer-swatch" style={{ backgroundColor: '#71827d' }} />
          all administrative regions
        </label>
        <label>
          <input
            type="checkbox"
            defaultChecked
            onChange={(event) => rangeLayersRef.current.nationalBorders?.setVisible(event.target.checked)}
          />
          <span className="geography-layer-swatch" style={{ backgroundColor: '#d5dfd9' }} />
          national borders
        </label>
        </>}
        {geographyKind === 'terrestrial' && adminLayerTypes.map((layerType) => (
          <label key={`admin-${layerType}`}>
            <input
              type="checkbox"
              defaultChecked
              onChange={(event) => rangeLayersRef.current[`admin-${layerType}`]?.setVisible(event.target.checked)}
            />
            <span className="geography-layer-swatch" style={{ backgroundColor: colorForLayer(layerType) }} />
            {layerType.replaceAll('_', ' ')} regions
          </label>
        ))}
        {ranges.map((range) => (
          <label key={range.id}>
            <input
              type="checkbox"
              defaultChecked
              onChange={(event) => rangeLayersRef.current[range.id]?.setVisible(event.target.checked)}
            />
            <span className="geography-layer-swatch" style={{ backgroundColor: colorForLayer(range.layerType) }} />
            {range.layerType.replaceAll('_', ' ')}
          </label>
        ))}
      </div>
    </div>
  );
};
