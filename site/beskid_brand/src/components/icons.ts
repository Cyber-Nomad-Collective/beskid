import { C, SERVICES, SERVICE_LABELS, type ServiceId } from "../lib/brand";
import type { IconSpec, Point } from "../lib/geometry";

type Regions = readonly (readonly Point[])[];
/** Each service is composed across the full mark. Masks remove structural channels. */
const SERVICE_GEOMETRY: Record<ServiceId, { body: Regions; cuts: Regions }> = {
  // Source branches converge into one output route; both former peaks participate.
  'beskid-core': {
    body: [
      [[12,86],[42,32],[64,64],[53,79],[41,58],[27,86]],
      [[48,86],[86,20],[101,62],[87,62],[82,49],[64,80],[94,80],[94,74],[108,88],[94,102],[94,96],[48,96]],
    ],
    cuts: [],
  },
  // The ridgeline is the shield's crown; one broad interior defines protected access.
  auth: {
    body: [[[12,84],[42,32],[60,52],[86,20],[108,84],[60,108]]],
    cuts: [[[28,80],[44,53],[60,72],[83,43],[93,80],[60,95]]],
  },
  // A mountain-topped reference spine connects three clear contractual rules.
  'platform-spec': {
    body: [[[12,96],[12,80],[42,32],[60,50],[86,20],[108,82],[108,96]]],
    cuts: [
      [[34,60],[110,60],[110,70],[29,70]],
      [[24,78],[110,78],[110,86],[24,86]],
    ],
  },
  // The two ridges become page edges; a shared binding connects them at the valley.
  book: {
    body: [[[12,86],[40,30],[60,50],[86,22],[108,86],[60,104]]],
    cuts: [
      [[28,81],[43,51],[54,61],[54,90]],
      [[66,60],[83,44],[94,80],[66,90]],
    ],
  },
  // A full-width execution chevron folds through both peaks and exits as a result.
  learn: {
    body: [[[12,78],[42,32],[60,52],[86,20],[108,70],[74,104],[52,104],[90,66],[81,46],[61,78],[42,56],[28,78]]],
    cuts: [],
  },
  // An open entry passage; its two sides lead into the ecosystem's rising roof.
  website: {
    body: [[[12,96],[12,82],[42,32],[60,52],[86,20],[108,82],[108,96]]],
    cuts: [[[28,96],[28,83],[43,56],[60,75],[83,46],[94,83],[94,96]]],
  },
  // One continuous stepped delivery route ends in the tallest summit.
  tracker: {
    body: [[[12,96],[12,78],[30,78],[30,60],[48,60],[48,42],[66,42],[86,20],[108,96],[92,96],[79,49],[66,60],[66,78],[48,78],[48,96]]],
    cuts: [],
  },
  // A release stack: the shared mountain crowns two connected publication layers.
  pckg: {
    body: [
      [[12,68],[42,28],[60,46],[86,20],[108,68],[60,88]],
      [[12,80],[60,98],[108,80],[108,90],[60,108],[12,90]],
    ],
    cuts: [
      [[31,62],[44,48],[60,64],[83,43],[91,61],[60,74]],
    ],
  },
  // Connected repository regions: both rising branches meet a shared graph junction.
  nexus: {
    body: [[[12,86],[40,32],[60,52],[86,20],[108,86],[94,96],[60,84],[26,96]]],
    cuts: [
      [[31,76],[43,53],[53,65]],
      [[68,65],[82,46],[92,76]],
    ],
  },
};

export function ServiceIcon(service: ServiceId, color: string = C.teal): IconSpec {
  const geometry = SERVICE_GEOMETRY[service];
  return {
    viewBox:[0,0,120,120],
    shapes:[{kind:'masked',id:`ridge-${service}`,body:geometry.body,cuts:geometry.cuts,fill:color}],
    title:`beskid ${SERVICE_LABELS[service]}`,
  };
}

export const SERVICE_ICONS = Object.fromEntries(
  SERVICES.map(service=>[service,(color?: string)=>ServiceIcon(service,color)]),
) as Record<ServiceId,(color?: string)=>IconSpec>;
