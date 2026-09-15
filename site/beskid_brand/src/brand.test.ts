import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CleanArtifacts, ARTIFACT_FILENAMES } from './clean';
import { MARK_POLYGONS, SERVICES, C } from './lib/brand';
import { LOGOS, horizontalVariant } from './components/logos';
import { mergedServiceDark, mergedServiceHorizontal, mergedServiceStacked } from './components/service-logos';
import { SERVICE_ICONS } from './components/icons';
import { renderIcon } from './lib/svg';
import { Preview } from './preview';

describe('brand delivery contract', () => {
  it('cleanup preserves configuration and unrelated artwork', () => {
    const directory = mkdtempSync(join(tmpdir(), 'beskid-brand-'));
    const preserved = ['package.json','tsconfig.json','pnpm-lock.yaml','custom.svg'];
    try {
      for (const name of [...preserved,'beskid-icon.svg','beskid-logo-static.json']) writeFileSync(join(directory,name),'keep');
      CleanArtifacts(directory);
      for (const name of preserved) expect(readFileSync(join(directory,name),'utf8')).toBe('keep');
      expect(existsSync(join(directory,'beskid-icon.svg'))).toBe(false);
      expect(existsSync(join(directory,'beskid-logo-static.json'))).toBe(false);
      expect(new Set(ARTIFACT_FILENAMES).size).toBe(ARTIFACT_FILENAMES.length);
    } finally { rmSync(directory,{recursive:true,force:true}); }
  });
  it('exports self-contained, named SVGs with outlined typography', () => {
    const specs = [...Object.values(LOGOS).map(draw=>draw()), ...SERVICES.flatMap(service=>[
      SERVICE_ICONS[service](),mergedServiceHorizontal(service),mergedServiceStacked(service),mergedServiceDark(service),
    ])];
    for (const spec of specs) {
      const svg=renderIcon(spec);
      expect(svg).toContain('role="img"');
      expect(svg).toContain('aria-label="beskid');
      expect(svg).not.toMatch(/<text\b|<image\b|<script\b|font-family=|NaN|undefined/);
      expect(svg).toBe(renderIcon(spec));
    }
  });
  it('keeps inline service masks unique and resolves every reference', () => {
    const html = Preview();
    const ids = [...html.matchAll(/<mask id="([^"]+)"/g)].map(match => match[1]);
    const references = [...html.matchAll(/mask="url\(#([^)]+)\)"/g)].map(match => match[1]);
    expect(ids.length).toBe(SERVICES.length * 2);
    expect(new Set(ids).size).toBe(ids.length);
    expect(references.sort()).toEqual([...ids].sort());
    expect(html).toContain('mask-type:luminance');
  });
  it('supports genuine single-ink output', () => {
    const svg=renderIcon(horizontalVariant('#000000'));
    expect(svg).toContain('fill="#000000"');
    expect(svg).not.toContain(C.teal);
    expect(svg).not.toContain(C.ink);
  });
  it('keeps master geometry within its clear-space boundary', () => {
    for (const polygon of MARK_POLYGONS) {
      expect(polygon.length).toBeGreaterThanOrEqual(3);
      for (const [x,y] of polygon) {
        expect(x).toBeGreaterThanOrEqual(12);expect(x).toBeLessThanOrEqual(108);
        expect(y).toBeGreaterThanOrEqual(12);expect(y).toBeLessThanOrEqual(108);
      }
    }
  });
});
