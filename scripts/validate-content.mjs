import manifest from '../content/collections.json' with { type: 'json' };
import { validateManifest } from './content-schema.mjs';

const errors = validateManifest(manifest);
if (errors.length) {
  console.error('Invalid collection manifest:\n' + errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}
console.log(`Collection manifest valid (${manifest.collections.length} collections).`);

