import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getAllOrganisms,
  getAllToxins,
  getGeographyByOrganismSlug,
  getMechanismByOrganismExposureSlug,
  getPhysiologyByOrganismExposureSlug,
  getToxicMaterialByOrganismSlug,
} from '../apps/web/src/lib/content';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const dataRoot = path.join(repoRoot, 'apps', 'web', 'public', 'data');

const ensureDir = (dirPath: string): void => {
  mkdirSync(dirPath, { recursive: true });
};

const writeJson = (filePath: string, payload: unknown): void => {
  writeFileSync(filePath, JSON.stringify(payload, null, 2));
};

rmSync(path.join(dataRoot, 'venoms'), { recursive: true, force: true });

for (const directory of ['organisms', 'toxic-materials', 'toxins', 'mechanisms']) {
  const directoryPath = path.join(dataRoot, directory);
  rmSync(directoryPath, { recursive: true, force: true });
  ensureDir(directoryPath);
}

for (const organism of getAllOrganisms()) {
  const slug = organism.organism.slug ?? organism.organism.id;
  writeJson(path.join(dataRoot, 'organisms', `${slug}.json`), organism);

  const toxicMaterial = getToxicMaterialByOrganismSlug(slug);
  if (toxicMaterial) {
    writeJson(
      path.join(
        dataRoot,
        'toxic-materials',
        `${toxicMaterial.toxicMaterial.slug ?? toxicMaterial.toxicMaterial.id}.json`,
      ),
      toxicMaterial,
    );
  }

  const geography = getGeographyByOrganismSlug(slug);
  if (geography) {
    writeJson(path.join(dataRoot, 'organisms', `${slug}.geography.json`), geography);
  }

  const mechanism = getMechanismByOrganismExposureSlug(slug);
  if (mechanism) {
    writeJson(path.join(dataRoot, 'organisms', `${slug}.mechanism.json`), mechanism);
  }

  const physiology = getPhysiologyByOrganismExposureSlug(slug);
  if (physiology) {
    writeJson(path.join(dataRoot, 'organisms', `${slug}.physiology.json`), physiology);
  }
}

for (const toxin of getAllToxins()) {
  const slug = toxin.toxin.slug ?? toxin.toxin.id;
  writeJson(path.join(dataRoot, 'toxins', `${slug}.json`), toxin);

}

console.log(`Static JSON artifacts written to ${dataRoot}`);
