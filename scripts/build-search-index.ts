import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getAllOrganisms,
  getAllToxins,
  getMechanismByToxinSlug,
  getPhysiologyByToxinSlug,
  getVenomByOrganismSlug,
} from '../apps/web/src/lib/content';

interface SearchIndexRecord {
  id: string;
  entityType: 'organism' | 'venom' | 'toxin' | 'mechanism' | 'effect';
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

  const venom = getVenomByOrganismSlug(slug);
  if (venom) {
    records.push({
      id: venom.venom.id,
      entityType: 'venom',
      title: venom.venom.name,
      aliases: [venom.venom.name],
      summary: venom.venom.description,
      tags: ['venom', 'composition'],
      route: `/organisms/${slug}/venom`,
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

  const mechanism = getMechanismByToxinSlug(slug);
  if (mechanism) {
    records.push({
      id: `mechanism-${slug}`,
      entityType: 'mechanism',
      title: `${toxinBundle.toxin.displayName} mechanism`,
      aliases: mechanism.steps.map((step) => step.title),
      summary: mechanism.steps[0]?.description ?? 'Mechanism summary unavailable.',
      tags: ['mechanism'],
      route: `/toxins/${slug}/mechanism`,
    });
  }

  const physiology = getPhysiologyByToxinSlug(slug);
  if (physiology) {
    records.push({
      id: `effect-${slug}`,
      entityType: 'effect',
      title: `${toxinBundle.toxin.displayName} effects`,
      aliases: physiology.effects.map((effect) => effect.title),
      summary: physiology.effects[0]?.description ?? 'Physiology summary unavailable.',
      tags: ['effect', 'physiology'],
      route: `/toxins/${slug}/physiology`,
    });
  }
}

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const dataRoot = path.join(repoRoot, 'apps', 'web', 'public', 'data');
mkdirSync(dataRoot, { recursive: true });
writeFileSync(path.join(dataRoot, 'search-index.json'), JSON.stringify(records, null, 2));

console.log(`Search index built (${records.length} records).`);
