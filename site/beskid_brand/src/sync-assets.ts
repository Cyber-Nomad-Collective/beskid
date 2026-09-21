/** Generated consumers retain standalone assets for independently built submodules. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { ServiceIcon } from './components/icons';
import { iconVariant } from './components/logos';
import { C, type ServiceId } from './lib/brand';
import { renderIcon } from './lib/svg';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const Mark = (service?: ServiceId, color: string = C.teal) => renderIcon(service ? ServiceIcon(service, color) : iconVariant(color));
const Write = (path: string, data: string | Buffer) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, data);
};
const svgTargets: [string, ServiceId | undefined, string?][] = [
  ['beskid_vscode/media/beskid-logo.svg', undefined, '#ffffff'],
  ['beskid_vscode/media/beskid-pckg.svg', 'pckg', C.tealLight],
  ['beskid_distrib/assets/icons/beskid-logo.svg', undefined],
  ['site/website/public/favicon.svg', 'website'],
  ['site/website/src/assets/beskid_logo.svg', undefined],
  ['site/auth/public/favicon.svg', 'auth'],
  ['site/learn/public/favicon.svg', 'learn'],
  ['beskid_sites/apps/pckg/public/favicon.svg', 'pckg'],
  ['beskid_nexus/gitnexus-web/public/favicon.svg', 'nexus'],
  ['beskid_tracker/public/favicon.svg', 'tracker'],
  ['beskid_sites/apps/website/public/favicon.svg', 'website'],
  ['beskid_sites/apps/shell-template/public/favicon.svg', undefined],
];
for (const [path, service, color] of svgTargets) {
  Write(path, Mark(service, color));
  if (path.endsWith('/public/favicon.svg')) {
    Write(path.replace('favicon.svg', 'logo.svg'), Mark(service));
    Write(path.replace('favicon.svg', 'logo-dark.svg'), Mark(service, C.tealLight));
  }
}
for (const path of ['beskid_vscode/icon.png', 'beskid_distrib/assets/icons/beskid-512.png']) {
  Write(path, await sharp(Buffer.from(Mark())).resize(512, 512).png().toBuffer());
}


for (const size of [192, 512]) {
  Write(`beskid_tracker/public/logo${size}.png`, await sharp(Buffer.from(Mark('tracker'))).resize(size, size).png().toBuffer());
}
// PNG-encoded ICO entries preserve alpha at each native favicon size.
const sizes = [16, 24, 32, 64];
const images = await Promise.all(sizes.map(size => sharp(Buffer.from(Mark('tracker'))).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + images.length * 16);
header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((bytes, index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index]; header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(bytes.length, entry + 8); header.writeUInt32LE(offset, entry + 12);
  offset += bytes.length;
});
Write('beskid_tracker/public/favicon.ico', Buffer.concat([header, ...images]));
execFileSync(process.execPath, [resolve(root, 'beskid_web_common/scripts/sync-brand-icons.mjs'), resolve(root, 'site/beskid_brand')], { stdio: 'inherit' });

console.log("Synced application, editor, installer, and shared UI brand assets.");
