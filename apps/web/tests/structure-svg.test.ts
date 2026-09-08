import { readFileSync } from 'node:fs';
import * as OCL from 'openchemlib';
import { describe, expect, it } from 'vitest';
import { generateSvgFromMolfile } from '../../../scripts/structure-svg';

describe('stereochemistry-preserving 2D publication', () => {
  it.each(['solenopsin-a', 'batrachotoxin'])('retains all renderer geometry, labels and viewport for %s', (slug) => {
    const sdf = readFileSync(`public/structures/${slug}.sdf`, 'utf8').trim();
    const molecule = OCL.Molecule.fromMolfile(sdf);
    const identity = molecule.getIDCode();
    molecule.removeExplicitHydrogens();
    expect(molecule.getIDCode()).toBe(identity);
    const expected = molecule.toSVG(1400, 420, 'molecular-structure', { autoCrop: true, autoCropMargin: 40 });
    expect(expected).toContain('this enantiomer');
    expect(expected).toMatch(/>\s*[RS]\s*<\/text>/);
    const svg = generateSvgFromMolfile(sdf, 1400, 420);
    expect(svg).toBe(expected);
    expect(readFileSync(`public/images/${slug}-2d.svg`, 'utf8')).toBe(svg);
  });

  it('keeps distinct enantiomers distinct', () => {
    const r = OCL.Molecule.fromSmiles('N[C@H](C)C(=O)O').toMolfile();
    const s = OCL.Molecule.fromSmiles('N[C@@H](C)C(=O)O').toMolfile();
    expect(generateSvgFromMolfile(r, 500, 300)).not.toBe(generateSvgFromMolfile(s, 500, 300));
  });
});