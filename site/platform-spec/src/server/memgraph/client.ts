import "@tanstack/react-start/server-only";

import neo4j, {
	type Driver,
	type Record as Neo4jRecord,
} from "neo4j-driver";

import { env } from "#/env.server";

import { ensureSchema } from "./schema";

let driver: Driver | null = null;
let schemaReady: Promise<void> | null = null;

export function getDriver(): Driver {
	if (!driver) {
		driver = neo4j.driver(env.MEMGRAPH_URI, neo4j.auth.basic("", ""));
	}
	return driver;
}

function mapRecord<T extends Record<string, unknown>>(
	record: Neo4jRecord,
): T {
	const row: Record<string, unknown> = {};
	for (const key of record.keys) {
		row[String(key)] = record.get(key);
	}
	return row as T;
}

export async function runQuery<T extends Record<string, unknown> = Record<string, unknown>>(
	cypher: string,
	params: Record<string, unknown> = {},
): Promise<T[]> {
	const session = getDriver().session();
	try {
		const result = await session.run(cypher, params);
		return result.records.map((record: Neo4jRecord) => mapRecord<T>(record));
	} finally {
		await session.close();
	}
}

export async function runWrite(
	cypher: string,
	params: Record<string, unknown> = {},
): Promise<void> {
	const session = getDriver().session();
	try {
		await session.executeWrite((tx) => tx.run(cypher, params));
	} finally {
		await session.close();
	}
}

export async function pingMemgraph(): Promise<boolean> {
	try {
		const rows = await runQuery<{ ok: number }>("RETURN 1 AS ok");
		return rows[0]?.ok === 1;
	} catch {
		return false;
	}
}

export async function ensureMemgraphReady(): Promise<void> {
	if (!schemaReady) {
		schemaReady = ensureSchema();
	}
	await schemaReady;
}

export async function closeMemgraph(): Promise<void> {
	if (driver) {
		await driver.close();
		driver = null;
		schemaReady = null;
	}
}
