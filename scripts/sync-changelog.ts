import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf-8')) as {
  name: string;
  version: string;
};

const pkgName = pkg.name;
const newVersion = pkg.version;
const safeName = pkgName.replace('/', '!');
const changelogFile = join(root, '.changeset', 'changelogs', `${safeName}@${newVersion}.md`);

let newSection: string;
try {
  newSection = await readFile(changelogFile, 'utf-8');
} catch {
  console.error(`[sync-changelog] changelog file not found: ${changelogFile}`);
  process.exit(0);
}

const changelogPath = join(root, 'CHANGELOG.md');
const current = await readFile(changelogPath, 'utf-8');
const versionHeader = `## ${newVersion}`;

if (current.includes(`\n${versionHeader}\n`)) {
  console.log(
    `[sync-changelog] section ${versionHeader} already present in CHANGELOG.md, skipping`,
  );
  process.exit(0);
}

newSection = newSection.trimEnd() + '\n';
const lines = current.split('\n');
const firstSectionIdx = lines.findIndex(l => l.startsWith('## '));

let updated: string;
if (firstSectionIdx === -1) {
  updated = lines[0] + '\n\n' + newSection + lines.slice(1).join('\n');
} else {
  updated =
    lines.slice(0, firstSectionIdx).join('\n') +
    '\n\n' +
    newSection +
    '\n' +
    lines.slice(firstSectionIdx).join('\n');
}

await writeFile(changelogPath, updated);
console.log(`[sync-changelog] appended ${versionHeader} to CHANGELOG.md`);
