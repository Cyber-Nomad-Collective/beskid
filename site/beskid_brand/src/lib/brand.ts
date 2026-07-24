/**
 * Beskid brand constants.
 * Mountain motif: a dramatic 3-peak silhouette with 3D poly-faceted body.
 * NO curves, NO opacity — every surface is a flat polygon.
 */

export const C = {
  teal: "#3aac9e",
  tealDark: "#1a6b62",
  tealLight: "#5eeadb",
  tealLightDark: "#3aa89a",
  bgDark: "#0d1117",
  strokeW: 2.5,
} as const;

/** Front ridgeline — three dramatic peaks. Central peak lower, giving asymmetry. */
export const RIDGE: readonly [number, number][] = [
  [16, 70],   // left base
  [34, 20],   // left peak
  [60, 54],   // central dip
  [86, 14],   // right peak (tallest)
  [106, 70],  // right base
];

/**
 * 3D faceted body — composed of triangular facets connecting the ridgeline
 * to the offset base. Each facet is a separate polygon for visible geometric depth.
 * This is the "poly shape" — no single flat back-face, but distinct triangular panels.
 */
export const FACETS: ReadonlyArray<readonly [number, number][]> = [
  // Left slope face
  [[16, 70], [34, 20], [34, 34], [16, 84]],
  // Center-left face
  [[34, 20], [60, 54], [60, 68], [34, 34]],
  // Center-right face
  [[60, 54], [86, 14], [86, 28], [60, 68]],
  // Right slope face
  [[86, 14], [106, 70], [106, 84], [86, 28]],
];

export const SERVICES = [
  "beskid-core",
  "auth",
  "platform-spec",
  "learn",
  "website",
  "tracker",
  "pckg",
  "nexus",
] as const;

export type ServiceId = (typeof SERVICES)[number];

export const SERVICE_LABELS: Record<ServiceId, string> = {
  "beskid-core": "Beskid Core",
  auth: "Beskid Auth",
  "platform-spec": "Platform Spec",
  learn: "Beskid Learn",
  website: "Beskid Website",
  tracker: "Beskid Tracker",
  pckg: "Beskid Package Registry",
  nexus: "Beskid Nexus",
};

/** Short labels for compact text variants. */
export const SERVICE_SHORT: Record<ServiceId, string> = {
  "beskid-core": "beskid core",
  auth: "beskid auth",
  "platform-spec": "beskid spec",
  learn: "beskid learn",
  website: "beskid site",
  tracker: "beskid track",
  pckg: "beskid pckg",
  nexus: "beskid nexus",
};
