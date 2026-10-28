import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const files = ['docs/index.html', 'docs/styles.css', 'docs/version.json', 'docs/src/main.js', 'docs/src/version.js', 'docs/src/game/setup.js', 'docs/src/game/hand.js', 'docs/src/game/pots.js', 'docs/src/i18n.js'];
const contents = await Promise.all(files.map(path => readFile(path, 'utf8')));
const release = JSON.parse(contents[2]).version;
if (!/^\d+\.\d+\.\d+$/.test(release)) throw new Error('Invalid release version');
console.log(`Version ${release} · build ${createHash('sha256').update(contents.join('\n')).digest('hex').slice(0, 8)}`);
