import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getAllOrganisms,
  getAllToxins,
  getMechanismByOrganismExposureSlug,
  getPhysiologyByOrganismExposureSlug,
  getToxicMaterialByOrganismSlug,
} from '../apps/web/src/lib/content';

interface SearchIndexRecord {
  id: string;
  entityType: 'organism' | 'toxic_material' | 'toxin' | 'mechanism' | 'effect';
  title: string;
  scientificName?: string;
  aliases: string[];
  summary: string;
  tags: string[];
  route: string;
}

const records: SearchIndexRecord[] = [];

for (const organismBundle of getAllOrganisms()) {
  const slug = organismBundle.organism.slug ?? organismBundle.organism.id;
  records.push({
    id: organismBundle.organism.id,
    entityType: 'organism',
    title: organismBundle.organism.commonName,
    scientificName: organismBundle.organism.scientificName,
    aliases: [organismBundle.organism.scientificName, organismBundle.organism.commonName],
    summary: organismBundle.organism.overview,
    tags: ['organism', 'taxonomy'],
    route: `/organisms/${slug}`,
  });

  const toxicMaterial = getToxicMaterialByOrganismSlug(slug);
  if (toxicMaterial) {
    records.push({
      id: toxicMaterial.toxicMaterial.id,
      entityType: 'toxic_material',
      title: toxicMaterial.toxicMaterial.name,
      aliases: [toxicMaterial.toxicMaterial.name],
      summary: toxicMaterial.toxicMaterial.description,
      tags: [toxicMaterial.toxicMaterial.materialKind, 'composition'],
      route: `/organisms/${slug}/toxic-material`,
    });
  }

  const mechanism = getMechanismByOrganismExposureSlug(slug);
  if (mechanism) {
    records.push({
      id: `mechanism-${slug}`,
      entityType: 'mechanism',
      title: `${organismBundle.organism.commonName} exposure mechanism`,
      aliases: mechanism.steps.map((step) => step.title),
      summary: mechanism.steps[0]?.description ?? 'Exposure mechanism summary unavailable.',
      tags: ['mechanism', 'exposure'],
      route: `/atlas/${slug}#section-medical-effects`,
    });
  }

  const physiology = getPhysiologyByOrganismExposureSlug(slug);
  if (physiology) {
    records.push({
      id: `effect-${slug}`,
      entityType: 'effect',
      title: `${organismBundle.organism.commonName} sting effects`,
      aliases: physiology.effects.map((effect) => effect.title),
      summary: physiology.effects[0]?.description ?? 'Exposure effects summary unavailable.',
      tags: ['effect', 'physiology', 'exposure'],
      route: `/atlas/${slug}#section-medical-effects`,
    });
  }
}

for (const toxinBundle of getAllToxins()) {
  const slug = toxinBundle.toxin.slug ?? toxinBundle.toxin.id;
  records.push({
    id: toxinBundle.toxin.id,
    entityType: 'toxin',
    title: toxinBundle.toxin.displayName,
    aliases: [toxinBundle.toxin.family ?? ''],
    summary: toxinBundle.toxin.notes ?? 'No toxin notes available.',
    tags: ['toxin', toxinBundle.toxin.family ?? 'unclassified'],
    route: `/toxins/${slug}`,
  });

}

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const dataRoot = path.join(repoRoot, 'apps', 'web', 'public', 'data');
mkdirSync(dataRoot, { recursive: true });
writeFileSync(path.join(dataRoot, 'search-index.json'), JSON.stringify(records, null, 2));

console.log(`Search index built (${records.length} records).`);
