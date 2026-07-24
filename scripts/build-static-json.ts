import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getAllOrganisms,
  getAllToxins,
  getGeographyByOrganismSlug,
  getMechanismByToxinSlug,
  getPhysiologyByToxinSlug,
  getVenomByOrganismSlug,
} from '../apps/web/src/lib/content';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const dataRoot = path.join(repoRoot, 'apps', 'web', 'public', 'data');

const ensureDir = (dirPath: string): void => {
  mkdirSync(dirPath, { recursive: true });
};

const writeJson = (filePath: string, payload: unknown): void => {
  writeFileSync(filePath, JSON.stringify(payload, null, 2));
};

ensureDir(path.join(dataRoot, 'organisms'));
ensureDir(path.join(dataRoot, 'venoms'));
ensureDir(path.join(dataRoot, 'toxins'));
ensureDir(path.join(dataRoot, 'mechanisms'));

for (const organism of getAllOrganisms()) {
  const slug = organism.organism.slug ?? organism.organism.id;
  writeJson(path.join(dataRoot, 'organisms', `${slug}.json`), organism);

  const venom = getVenomByOrganismSlug(slug);
  if (venom) {
    writeJson(path.join(dataRoot, 'venoms', `${venom.venom.slug ?? venom.venom.id}.json`), venom);
  }

  const geography = getGeographyByOrganismSlug(slug);
  if (geography) {
    writeJson(path.join(dataRoot, 'organisms', `${slug}.geography.json`), geography);
  }
}

for (const toxin of getAllToxins()) {
  const slug = toxin.toxin.slug ?? toxin.toxin.id;
  writeJson(path.join(dataRoot, 'toxins', `${slug}.json`), toxin);

  const mechanism = getMechanismByToxinSlug(slug);
  if (mechanism) {
    writeJson(path.join(dataRoot, 'mechanisms', `${slug}.json`), mechanism);
  }

  const physiology = getPhysiologyByToxinSlug(slug);
  if (physiology) {
    writeJson(path.join(dataRoot, 'toxins', `${slug}.physiology.json`), physiology);
  }
}

console.log(`Static JSON artifacts written to ${dataRoot}`);
