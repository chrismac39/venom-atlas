import * as OCL from 'openchemlib';

/** Preserve the renderer's wedges and stereochemical labels. Use its own
 * bounds-aware cropping: regex line coordinates miss paths and text bounds.
 * Depiction is not independent verification of the input chemical identity.
 */
export const generateSvgFromMolfile = (molfile: string, width: number, height: number): string => {
  const molecule = OCL.Molecule.fromMolfile(molfile);
  if (!molecule.getAllAtoms()) throw new Error('Cannot depict an empty structure.');
  molecule.removeExplicitHydrogens();
  // OCL's atom bounds omit the below-molecule "this enantiomer" annotation.
  // Reserve space for it; browser tests also check every text bounding box.
  return molecule.toSVG(width, height, 'molecular-structure', { autoCrop: true, autoCropMargin: 40 });
};