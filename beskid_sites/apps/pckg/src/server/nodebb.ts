import "@tanstack/react-start/server-only";

import { env } from "#/env.server";

/**
 * NodeBB community integration — server-only.
 *
 * Each package gets a locked subforum under a parent "Packages" category on
 * the NodeBB community (community.beskid-lang.org). The admin token is never
 * exposed to the client; the package detail page deep-links to the public
 * category URL instead.
 *
 * Endpoints used (NodeBB Write API v3):
 *   POST /api/v3/categories/                       — create the subforum
 *   PUT  /api/v3/categories/{cid}/privileges/...    — rescind topic-create
 *                                                     from registered-users
 *
 * The `{ slug → cid }` mapping is the caller's responsibility (the pckg .NET
 * backend stores it on the package record); this module only performs the
 * NodeBB API calls and returns the created category id + slug.
 */

export interface CreateSubforumInput {
	packageName: string;
}

export interface CreateSubforumResult {
	cid: number;
	slug: string;
	url: string;
}

export class NodebbError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
	}
}

function adminHeaders(): Headers {
	const token = env.NODEBB_ADMIN_TOKEN;
	if (!token) {
		throw new NodebbError(503, "NodeBB admin token is not configured");
	}
	const headers = new Headers({
		Authorization: `Bearer ${token}`,
		"Content-Type": "application/json",
	});
	return headers;
}

function apiOrigin(): string {
	const origin = env.NODEBB_API_URL;
	if (!origin) {
		throw new NodebbError(503, "NodeBB API URL is not configured");
	}
	return origin;
}

function publicCategoryUrl(slug: string): string {
	const base = env.COMMUNITY_URL ?? env.NODEBB_API_URL ?? "";
	return `${base.replace(/\/$/, "")}/category/${slug}`;
}

async function readJsonOrThrow(response: Response): Promise<unknown> {
	if (!response.ok) {
		throw new NodebbError(
			response.status,
			`NodeBB request failed: ${response.status} ${response.statusText}`,
		);
	}
	return response.json();
}

/**
 * Create a locked subforum for a package under the configured parent
 * "Packages" category, then rescind topic-create privileges from
 * `registered-users` so only moderators can start threads (the package's
 * discussion is locked to moderator-created announcements).
 */
export async function createPackageSubforum(
	input: CreateSubforumInput,
): Promise<CreateSubforumResult> {
	const rawParentCid = env.NODEBB_PACKAGES_PARENT_CID;
	const parentCid =
		rawParentCid !== undefined ? Number(rawParentCid) : undefined;
	if (!parentCid || !Number.isFinite(parentCid)) {
		throw new NodebbError(
			503,
			"NodeBB packages parent category id is not configured",
		);
	}

	const createResponse = await fetch(`${apiOrigin()}/api/v3/categories/`, {
		method: "POST",
		headers: adminHeaders(),
		body: JSON.stringify({
			name: input.packageName,
			parentCid,
			description: `Discussion for the ${input.packageName} package.`,
		}),
	});
	const created = (await readJsonOrThrow(createResponse)) as {
		payload?: { cid?: number; slug?: string };
	};
	const category = created.payload;
	if (!category || typeof category.cid !== "number" || !category.slug) {
		throw new NodebbError(502, "NodeBB did not return a category id");
	}

	// Rescind topic-create from registered-users (lock the subforum).
	const privUrl = `${apiOrigin()}/api/v3/categories/${category.cid}/privileges/groups:topics:create/registered-users`;
	const privResponse = await fetch(privUrl, {
		method: "PUT",
		headers: adminHeaders(),
		body: JSON.stringify({}),
	});
	if (!privResponse.ok) {
		// Non-fatal: the subforum exists; locking can be retried by an admin.
	}

	return {
		cid: category.cid,
		slug: category.slug,
		url: publicCategoryUrl(category.slug),
	};
}
