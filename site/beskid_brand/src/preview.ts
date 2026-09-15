import { ServiceIcon } from './components/icons';
import { C, SERVICES, SERVICE_LABELS, SERVICE_MEANINGS } from './lib/brand';
import { horizontalVariant, iconVariant } from './components/logos';
import { mergedServiceHorizontal } from './components/service-logos';
import { renderIcon } from './lib/svg';

/** Preview choices do not silently change the production master palette. */
export const PREVIEW_PALETTES = [
  { name: 'Forest', primary: '#087F70', reversed: '#64D8BC', note: 'Cool, mineral green. The earlier palette.' },
  { name: 'Pine', primary: '#166534', reversed: '#86EFAC', note: 'A deeper woodland green, closer to the mountains.' },
  { name: 'Moss', primary: '#4D6B32', reversed: '#B6D785', note: 'Warm and earthy, with a quieter natural character.' },
  { name: 'Emerald', primary: C.teal, reversed: C.tealLight, note: 'Selected. A vivid green with a little blue in its undertone.' },
] as const;

function ThemedSvg(svg: string, prefix: string): string {
  svg = svg.replace(/id="(ridge-[^"]+)"/g, `id="${prefix}-$1"`).replace(/url\(#(ridge-[^)]+)\)/g, `url(#${prefix}-$1)`);
  return svg.replaceAll(`fill="${C.teal}"`, 'fill="var(--mark)"')
    .replaceAll(`stroke="${C.teal}"`, 'stroke="var(--mark)"')
    .replaceAll(`fill="${C.ink}"`, 'fill="var(--wordmark)"');
}

/** Self-contained vector review board with paired green palettes and theme controls. */
export function Preview(): string {
  let instance = 0;
  const themed = (svg: string) => ThemedSvg(svg, `sample-${instance++}`);
  const logo = themed(renderIcon(horizontalVariant()));
  const mark = themed(renderIcon(iconVariant()));
  return `<!doctype html><html lang="en" data-theme="light"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>beskid — Ridge identity</title>
<style>
@font-face{font-family:Inter;src:url('node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2')}@font-face{font-family:Inter;src:url('node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2');font-weight:700}
:root{--primary:${C.teal};--reversed:${C.tealLight};--ink:${C.ink};--paper:${C.paper};--page:var(--paper);--surface:#fff;--text:var(--ink);--muted:#47645a;--line:#cdd3c9;--mark:var(--primary);--wordmark:var(--ink);color-scheme:light}
:root[data-theme=dark]{--page:#0C201D;--surface:#15332D;--text:var(--paper);--muted:#B5C9BF;--line:#36564B;--mark:var(--reversed);--wordmark:var(--paper);color-scheme:dark}
*{box-sizing:border-box}body{margin:0;background:var(--page);color:var(--text);font-family:Inter,system-ui,sans-serif;font-size:15px;line-height:1.6}main{max-width:1440px;margin:auto;padding:40px 64px}header{display:flex;justify-content:space-between;align-items:center;gap:20px;border-bottom:1px solid var(--line);padding-bottom:24px}.eyebrow,small{font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:700}h1{font-size:64px;letter-spacing:-3.8px;line-height:1.06;margin:24px 0}h2{font-size:32px;letter-spacing:-1.2px;margin:0 0 10px}p{max-width:660px;margin:0 0 20px;color:var(--muted)}.hero{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;padding:58px 0}.hero-mark{height:250px;display:flex;align-items:center;justify-content:center}.hero-mark svg{width:100%;max-width:490px}.section{padding:38px 0;border-top:1px solid var(--line)}.heading{display:flex;justify-content:space-between;gap:16px;align-items:baseline;margin-bottom:24px}.modes{display:flex;gap:4px}.modes button{padding:8px 14px;border-radius:5px}.palettes{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.palette{padding:18px;text-align:left;background:var(--surface);border:2px solid var(--line);display:flex;flex-direction:column;gap:12px}.palette[aria-pressed=true]{border-color:var(--mark)}.palette-title{display:flex;justify-content:space-between;align-items:center;font-weight:700}.selection{visibility:hidden;font-size:11px}.palette[aria-pressed=true] .selection{visibility:visible}.palette small{letter-spacing:0;font-size:11px;font-weight:400}.palette p{font-size:12px;margin:0}.palette-art{display:grid;grid-template-columns:1fr 1fr;width:100%}.palette-art span{display:flex;justify-content:center;padding:14px 8px}.palette-art svg{width:70px;height:70px}.light-sample{background:#fff;--mark:var(--primary);--wordmark:var(--ink);color:var(--ink)}.dark-sample{background:${C.bgDark};--mark:var(--reversed);--wordmark:var(--paper);color:var(--paper)}.pair{display:grid;grid-template-columns:1fr 1fr;gap:18px}.panel{min-height:215px;padding:30px;display:flex;flex-direction:column;justify-content:space-between}.panel svg{width:330px;max-width:100%;align-self:center}.sizes{display:flex;align-items:end;gap:40px;padding:32px;background:var(--surface)}.size{text-align:center;display:grid;gap:12px;justify-items:center}.size small{letter-spacing:0;font-weight:400}.swatches{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.swatch{height:120px;padding:18px;display:flex;flex-direction:column;justify-content:space-between}.services{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.service{padding:22px;background:var(--surface)}.service svg{width:100%}.platforms{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.platform{background:var(--surface);padding:24px;text-align:center}.platform svg{display:block;width:120px;height:120px;margin:0 auto 20px}.platform b{display:block;font-size:15px}.platform small{font-weight:400;letter-spacing:0;color:var(--muted)}footer{border-top:1px solid var(--line);padding:24px 0;font-size:12px;color:var(--muted)}a{color:inherit}button{font:inherit;cursor:pointer;border:1px solid var(--line);background:transparent;color:inherit}button[aria-pressed=true]{background:var(--surface)}button:focus-visible,a:focus-visible{outline:3px solid var(--mark);outline-offset:4px}.status{font-size:13px;margin-top:20px}.mono-sample{background:#fff;color:#000}.reverse-sample{background:var(--primary);color:#fff}
@media(max-width:800px){main{padding:24px}header{align-items:flex-start;flex-direction:column}.hero,.pair{grid-template-columns:1fr}.palettes,.services,.swatches,.platforms{grid-template-columns:1fr 1fr}h1{font-size:48px}.sizes{gap:20px;flex-wrap:wrap}.heading{display:block}.hero{gap:0;padding:32px 0}.hero-mark{height:190px}.palette{padding:12px}.palette-art span{padding:8px 0}.palette-art svg{width:52px;height:52px}}@media(max-width:380px){.palettes{grid-template-columns:1fr}}@media print{.modes{display:none}main{padding:20px}.section{break-inside:avoid}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style><main><header><span class="eyebrow">beskid / Ridge identity</span><div class="modes" role="group" aria-label="Color mode"><button type="button" data-theme-choice="light" aria-pressed="true">Light</button><button type="button" data-theme-choice="dark" aria-pressed="false">Dark</button></div></header>
<section class="hero"><div><div class="eyebrow">Selected identity / Ridge</div><h1>A clearer way<br>to the summit.</h1><p>Two rising forms. One unmistakable silhouette. Mountain terrain, reduced to its essentials.</p><span class="eyebrow" id="hero-palette">Emerald / light</span></div><div class="hero-mark">${logo}</div></section>
<section class="section"><div class="heading"><h2>Find your green.</h2><span class="eyebrow">One identity / four palettes</span></div><p>Choose a green to see it across the whole family. Each palette pairs a deeper green for light surfaces with a brighter green for dark surfaces.</p><div class="palettes" role="group" aria-label="Green palette">${PREVIEW_PALETTES.map((palette,i)=>`<button type="button" class="palette" data-palette="${i}" aria-pressed="${i===3}" aria-label="${palette.name} palette"><span class="palette-title">${palette.name}<span class="selection" aria-hidden="true">Selected</span></span><span class="palette-art"><span style="background:white;--mark:${palette.primary}">${mark}</span><span style="background:${C.bgDark};--mark:${palette.reversed}">${mark}</span></span><small>${palette.primary} / ${palette.reversed}</small><span style="font-size:12px;color:var(--muted)">${palette.note}</span></button>`).join('')}</div><p class="status" id="palette-status" role="status">Previewing Emerald. Production exports use Emerald.</p></section>
<section class="section"><div class="heading"><h2>One mark. Every setting.</h2><span class="eyebrow">Light / dark / single ink</span></div><div class="pair"><div class="panel light-sample"><small>On light</small>${logo}</div><div class="panel dark-sample"><small>On dark</small>${logo}</div><div class="panel mono-sample"><small>Single ink</small>${renderIcon(horizontalVariant('#000000'))}</div><div class="panel reverse-sample"><small>Reversed</small>${renderIcon(horizontalVariant('#FFFFFF'))}</div></div></section>
<section class="section"><div class="heading"><h2>Small is the real test.</h2><span class="eyebrow">Actual CSS pixel sizes</span></div><div class="sizes">${[16,24,32,48,64,96].map(size=>`<div class="size"><span style="display:block;width:${size}px;height:${size}px">${mark}</span><small>${size}px</small></div>`).join('')}</div></section>
<section class="section"><div class="heading"><h2>The palette, together.</h2><span class="eyebrow">sRGB colors</span></div><div class="swatches"><div class="swatch" style="background:var(--primary);color:white"><b>Primary</b><small id="primary-hex">${C.teal}</small></div><div class="swatch" style="background:var(--reversed);color:var(--ink)"><b>Reversed</b><small id="reversed-hex">${C.tealLight}</small></div><div class="swatch" style="background:var(--ink);color:var(--paper)"><b>Deep forest</b><small>${C.ink}</small></div><div class="swatch" style="background:var(--paper);color:var(--ink)"><b>Limestone</b><small>${C.paper}</small></div></div></section>
<section class="section"><div class="heading"><h2>One silhouette. One service.</h2><span class="eyebrow">Platform icons / unified Ridge family</span></div><p>Both sides of the ridge participate in each service symbol. Broad masked channels define access, pages, reference rules, execution, delivery, publishing, and code relationships. Each mark is designed as a whole.</p><div class="platforms">${SERVICES.map(service=>`<article class="platform">${themed(renderIcon(ServiceIcon(service)))}<b>beskid ${SERVICE_LABELS[service]}</b><small>${SERVICE_MEANINGS[service]}</small></article>`).join('')}</div></section>
<section class="section"><div class="heading"><h2>A family with one identity.</h2><span class="eyebrow">Service signatures</span></div><div class="services">${SERVICES.map(service=>`<div class="service">${themed(renderIcon(mergedServiceHorizontal(service)))}</div>`).join('')}</div></section>
<footer>Ridge · editable SVG masters · outlined Inter lettering<br>See <a href="BRAND.md">BRAND.md</a> for usage and <a href="RESEARCH.md">RESEARCH.md</a> for decisions and sources. Color selections preview the identity; they do not overwrite exported assets.</footer></main>
<script>
const palettes = ${JSON.stringify(PREVIEW_PALETTES)};
let selectedPalette = 3;
let selectedTheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
try { const saved = JSON.parse(localStorage.getItem('beskid-ridge-preview-emerald') || 'null'); if (saved && Number.isInteger(saved.palette) && saved.palette >= 0 && saved.palette < palettes.length) selectedPalette = saved.palette; if (saved && ['light','dark'].includes(saved.theme)) selectedTheme = saved.theme; } catch {}
function updatePreview() {
  const palette = palettes[selectedPalette];
  document.documentElement.dataset.theme = selectedTheme;
  document.documentElement.style.setProperty('--primary', palette.primary);
  document.documentElement.style.setProperty('--reversed', palette.reversed);
  document.querySelectorAll('[data-palette]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.palette) === selectedPalette)));
  document.querySelectorAll('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === selectedTheme)));
  document.getElementById('hero-palette').textContent = palette.name + ' / ' + selectedTheme;
  document.getElementById('palette-status').textContent = 'Previewing ' + palette.name + '. Production exports use Emerald.';
  document.getElementById('primary-hex').textContent = palette.primary;
  document.getElementById('reversed-hex').textContent = palette.reversed;
  try { localStorage.setItem('beskid-ridge-preview-emerald', JSON.stringify({palette:selectedPalette,theme:selectedTheme})); } catch {}
}
document.querySelectorAll('[data-palette]').forEach(button => button.addEventListener('click', () => { selectedPalette = Number(button.dataset.palette); updatePreview(); }));
document.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => { selectedTheme = button.dataset.themeChoice; updatePreview(); }));
updatePreview();
</script></html>`;
}
