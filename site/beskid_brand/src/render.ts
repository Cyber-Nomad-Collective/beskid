import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SERVICE_ICONS } from './components/icons';
import { LOGOS, horizontalVariant, iconVariant } from './components/logos';
import { mergedServiceDark, mergedServiceHorizontal, mergedServiceStacked } from './components/service-logos';
import { C, SERVICES } from './lib/brand';
import { renderIcon } from './lib/svg';
import { textEl } from './lib/geometry';
import { Preview } from './preview';

const output = join(import.meta.dirname, '..');
function Write(name: string, contents: string): void {
  writeFileSync(join(output, name), contents, 'utf8');
}
for (const [variant, draw] of Object.entries(LOGOS)) Write(`beskid-${variant}.svg`, renderIcon(draw()));
for (const [name,color] of Object.entries({dark:C.tealLight,black:'#000000',white:'#FFFFFF'})) {
  Write(`beskid-icon-${name}.svg`,renderIcon(iconVariant(color)));
  Write(`beskid-logo-horizontal-${name}.svg`,renderIcon(horizontalVariant(color)));
}
Write('beskid-logo-wordmark.svg',renderIcon({viewBox:[0,0,240,90],title:'beskid',shapes:[textEl(120,67,'beskid',C.ink,{fontSize:64,fontWeight:700,letterSpacing:-2,textAnchor:'middle'})]}));
for (const service of SERVICES) {
  Write(`icon-${service}.svg`,renderIcon(SERVICE_ICONS[service]()));
  Write(`service-${service}-horizontal.svg`,renderIcon(mergedServiceHorizontal(service)));
  Write(`service-${service}-stacked.svg`,renderIcon(mergedServiceStacked(service)));
  Write(`service-${service}-dark.svg`,renderIcon(mergedServiceDark(service)));
}
Write('brand-preview.html',Preview());
console.log('Generated 47 production SVGs and brand-preview.html.');
