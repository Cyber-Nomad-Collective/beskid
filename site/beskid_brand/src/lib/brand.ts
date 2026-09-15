/** Canonical beskid identity geometry. All production formats consume this data. */
import type { Point } from './geometry';

export const C = {
  teal: '#047857',
  tealLight: '#6EE7B7',
  tealDark: '#064E3B',
  bgDark: '#102D2A',
  ink: '#102D2A',
  paper: '#F5F3EB',
} as const;

/** Two rising shoulders, separated by open ground. Coordinates on a 120-unit square. */
export const MARK_POLYGONS: readonly (readonly Point[])[] = [
  [[12,88],[42,38],[58,58],[48,76],[41,66],[28,88]],
  [[44,96],[86,24],[108,88],[89,88],[82,66],[64,96]],
];

export const SERVICES = ['beskid-core','auth','platform-spec','book','learn','website','tracker','pckg','nexus'] as const;
export type ServiceId = (typeof SERVICES)[number];
/** File identifiers are stable; the public label follows the current docs surface. */
export const SERVICE_LABELS: Record<ServiceId,string> = {
  'beskid-core': 'core', auth: 'auth', 'platform-spec': 'standard', book: 'book', learn: 'learn',
  website: 'website', tracker: 'tracker', pckg: 'pckg', nexus: 'nexus',
};
export const LOGO_VARIANTS = ['icon','logo-stacked','logo-horizontal','logo-dark'] as const;
export type LogoVariant = (typeof LOGO_VARIANTS)[number];

/** Service purposes, used to explain the visual metaphors in the review board. */
export const SERVICE_MEANINGS: Record<ServiceId,string> = {
  'beskid-core': 'Source becomes native output',
  auth: 'One identity, shared access',
  'platform-spec': 'The authoritative language contract',
  book: 'Connected chapters explain the language',
  learn: 'Edit, run, and check real code',
  website: 'Entry point to the ecosystem',
  tracker: 'Work progresses toward a release',
  pckg: 'Published, versioned modules',
  nexus: 'Explore relationships in code',
};
