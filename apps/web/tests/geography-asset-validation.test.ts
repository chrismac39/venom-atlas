import { describe, expect, it } from 'vitest';
import { validateFeatureCollection } from '../../../scripts/geography-asset-validation.js';

describe('geography asset validation', () => {
  it('accepts point feature collections for occurrence assets', () => {
    expect(() => validateFeatureCollection({
      assetPath: 'occurrences.geojson',
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-75, 4] },
          properties: { license: 'CC BY', sourceUrl: 'https://example.test/record' },
        }],
      },
      allowedGeometryTypes: ['Point'],
    })).not.toThrow();
  });

  it('rejects geometry types outside the asset contract', () => {
    expect(() => validateFeatureCollection({
      assetPath: 'range.geojson',
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
        }],
      },
      allowedGeometryTypes: ['Polygon', 'MultiPolygon'],
    })).toThrow(/Invalid geometry type/);
  });

  it('requires source metadata for curated geometry', () => {
    expect(() => validateFeatureCollection({
      assetPath: 'curated-range.geojson',
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
          properties: {},
        }],
      },
      allowedGeometryTypes: ['Polygon', 'MultiPolygon'],
      requireSourceMetadata: true,
    })).toThrow(/missing .*license or source URL/);

    expect(() => validateFeatureCollection({
      assetPath: 'invalid-source.geojson',
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-75, 4] },
          properties: { license: 'CC BY', sourceUrl: 'not-a-url' },
        }],
      },
      allowedGeometryTypes: ['Point'],
      requireSourceMetadata: true,
    })).toThrow(/missing valid license or source URL/);
  });

  it('rejects out-of-range coordinates and world-spanning jumps', () => {
    expect(() => validateFeatureCollection({
      assetPath: 'invalid-range.geojson',
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [181, 0] },
        }],
      },
      allowedGeometryTypes: ['Point'],
    })).toThrow(/Invalid coordinate range/);

    expect(() => validateFeatureCollection({
      assetPath: 'artifact-range.geojson',
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [[[170, 0], [-170, 0], [170, 0]]] },
        }],
      },
      allowedGeometryTypes: ['Polygon'],
    })).toThrow(/world-spanning coordinate jump/i);
  });
});
