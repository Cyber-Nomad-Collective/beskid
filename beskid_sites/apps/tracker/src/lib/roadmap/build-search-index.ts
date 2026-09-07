import "@tanstack/react-start/server-only";

import { buildRoadmapCatalog } from "#/lib/roadmap/build-catalog";
import type { RoadmapSearchHit } from "#/lib/roadmap/search-index";
import { loadAllVersionSeeds } from "#/lib/seed/load";

/** Server-only: reads seed JSON from disk. */
export function buildRoadmapSearchIndex(): RoadmapSearchHit[] {
	const hits: RoadmapSearchHit[] = [
		{
			id: "nav-timeline",
			kind: "nav",
			title: "Roadmap",
			subtitle: "Delivery versions and milestones",
			to: "/",
			keywords: "roadmap home delivery versions timeline",
		},
		{
			id: "nav-bugs",
			kind: "nav",
			title: "Bug tracker",
			subtitle: "Public issues labeled bug",
			to: "/bugs",
			keywords: "bugs tracker issues",
		},
	];

	const catalog = buildRoadmapCatalog();
	for (const version of catalog.versions) {
		hits.push({
			id: `version-${version.id}`,
			kind: "version",
			title: `${version.id}: ${version.title}`,
			subtitle: version.summary,
			versionId: version.id,
			to: "/versions/$version",
			params: { version: version.id },
			keywords: `${version.id} ${version.title} ${version.theme} ${version.status} ${version.summary}`,
		});

		for (const deliverable of version.deliverables) {
			hits.push({
				id: `deliverable-${version.id}-${deliverable.id}`,
				kind: "deliverable",
				title: deliverable.title,
				subtitle: `${version.id} · ${deliverable.id}`,
				versionId: version.id,
				to: "/versions/$version/deliverables/$deliverableId",
				params: { version: version.id, deliverableId: deliverable.id },
				keywords: `${deliverable.id} ${deliverable.title} ${deliverable.description ?? ""} deliverable milestone ${version.id}`,
			});
		}

		for (const ws of version.workstreams) {
			hits.push({
				id: `workstream-${version.id}-${ws.slug}`,
				kind: "workstream",
				title: ws.title,
				subtitle: `${version.id} · ${ws.slug}`,
				versionId: version.id,
				to: "/versions/$version/workstreams/$slug",
				params: { version: version.id, slug: ws.slug },
				keywords: `${ws.slug} ${ws.title} ${ws.summary} workstream ${version.id}`,
			});
		}
	}

	try {
		for (const bundle of loadAllVersionSeeds()) {
			for (const task of bundle.tasks) {
				hits.push({
					id: `task-${bundle.version.id}-${task.id}`,
					kind: "task",
					title: task.title,
					subtitle: `${bundle.version.id} · ${task.id} · ${task.statusColumn}${task.workstream ? ` · ${task.workstream}` : ""}`,
					versionId: bundle.version.id,
					to: "/v/$version",
					params: { version: bundle.version.id },
					search: { q: task.id },
					keywords: [
						task.id,
						task.order !== undefined ? String(task.order) : "",
						task.title,
						task.workstream,
						task.domain,
						task.area,
						task.feature,
						task.statusColumn,
						task.priority,
						task.source.subject,
						bundle.version.id,
					]
						.filter(Boolean)
						.join(" "),
				});
			}
		}
	} catch {
		// Seed optional
	}

	return hits;
}
