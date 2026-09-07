export type GeoJsonGeometryType = 'Point' | 'Polygon' | 'MultiPolygon';

type GeoJsonFeature = {
  type?: string;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
};

type GeoJsonFeatureCollection = {
  type?: string;
  features?: GeoJsonFeature[];
};

export const validateFeatureCollection = ({
  assetPath,
  data,
  allowedGeometryTypes,
  requireSourceMetadata = false,
}: {
  assetPath: string;
  data: unknown;
  allowedGeometryTypes: GeoJsonGeometryType[];
  requireSourceMetadata?: boolean;
}): void => {
  const collection = data as GeoJsonFeatureCollection;
  if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
    throw new Error(`Invalid GeoJSON FeatureCollection: ${assetPath}`);
  }

  collection.features.forEach((feature, index) => {
    if (feature.type !== 'Feature' || !feature.geometry || !allowedGeometryTypes.includes(feature.geometry.type as GeoJsonGeometryType)) {
      throw new Error(`Invalid geometry type in ${assetPath} feature ${index}`);
    }
    if (feature.geometry.coordinates === undefined) {
      throw new Error(`Missing geometry coordinates in ${assetPath} feature ${index}`);
    }
    validateCoordinates(feature.geometry.coordinates, assetPath, index);
    if (requireSourceMetadata && (!feature.properties?.license || !feature.properties?.sourceUrl)) {
      throw new Error(`Curated geometry missing license or source URL in ${assetPath} feature ${index}`);
    }
  });
};

const validateCoordinates = (coordinates: unknown, assetPath: string, featureIndex: number): void => {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    throw new Error(`Invalid geometry coordinates in ${assetPath} feature ${featureIndex}`);
  }
  if (typeof coordinates[0] === 'number') {
    const [longitude, latitude] = coordinates;
    if (
      typeof latitude !== 'number' ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      throw new Error(`Invalid coordinate range in ${assetPath} feature ${featureIndex}`);
    }
    return;
  }
  const coordinatePairs = coordinates.filter(
    (childCoordinates): childCoordinates is number[] =>
      Array.isArray(childCoordinates) && typeof childCoordinates[0] === 'number',
  );
  for (let index = 1; index < coordinatePairs.length; index += 1) {
    const previousLongitude = coordinatePairs[index - 1][0];
    const longitude = coordinatePairs[index][0];
    if (typeof previousLongitude === 'number' && typeof longitude === 'number' && Math.abs(longitude - previousLongitude) > 180) {
      throw new Error(`World-spanning coordinate jump in ${assetPath} feature ${featureIndex}`);
    }
  }
  coordinates.forEach((childCoordinates) => validateCoordinates(childCoordinates, assetPath, featureIndex));
};
