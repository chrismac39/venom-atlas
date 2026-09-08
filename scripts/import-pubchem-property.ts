import { readFileSync } from 'node:fs';
import path from 'node:path';
import { buildPubChemPropertyAssertions, type PubChemCache, type PubChemPropertyName } from './pubchem-import';

const argument = (name: string) => process.argv.find((entry) => entry.startsWith(`--${name}=`))?.slice(name.length + 3);
const cid = Number(argument('cid') ?? 107941);
const inchiKey = argument('inchi-key') ?? 'AYJGABFBAYKWDX-IRXDYDNUSA-N';
const subjectSlug = argument('subject') ?? 'solenopsin-a';
const properties = (argument('properties') ?? 'MolecularWeight').split(/[\s,]+/).filter(Boolean) as PubChemPropertyName[];
const cachePath = path.resolve(argument('cache') ?? `content-source/import-cache/pubchem/${cid}.json`);

const cache = JSON.parse(readFileSync(cachePath, 'utf8')) as PubChemCache;
const assertions = buildPubChemPropertyAssertions(cache, { cid, inchiKey, subjectSlug }, properties);
console.log(JSON.stringify({
  notice: 'Review this candidate against authored YAML. This command does not publish or modify content.',
  cachePath,
  assertions,
}, null, 2));