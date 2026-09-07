import "@tanstack/react-start/server-only";

import pino, { type Logger } from "pino";
import {
	Counter,
	collectDefaultMetrics,
	Histogram,
	Registry,
} from "prom-client";

/**
 * Inlined from `@cyber-nomad-collective/beskid-server-observability` so the
 * tracker no longer depends on a published GitHub Packages artifact inside the
 * `beskid_sites` workspace. The original package is ~140 lines; vendoring it
 * keeps the workspace self-contained (no `.npmrc` / `NODE_AUTH_TOKEN` needed).
 *
 * If the shell-template later exposes a shared observability helper, this copy
 * should be removed in favour of the template's.
 */

export interface ObservabilityOptions {
	service: string;
}

export interface ObservabilityBundle {
	service: string;
	registry: Registry;
	logger: Logger;
	httpRequestDuration: Histogram<"method" | "route" | "status_code">;
	httpRequestsTotal: Counter<"method" | "route" | "status_code">;
	renderMetrics: () => Promise<string>;
	recordHttpRequest: (
		method: string,
		route: string,
		statusCode: number,
		durationSeconds: number,
	) => void;
}

const PINO_LEVELS = new Set([
	"fatal",
	"error",
	"warn",
	"info",
	"debug",
	"trace",
	"silent",
]);

function resolveLogLevel(): string {
	const fromEnv = process.env.LOG_LEVEL;
	if (fromEnv && PINO_LEVELS.has(fromEnv.toLowerCase())) {
		return fromEnv.toLowerCase();
	}
	return "info";
}

export function normalizeRoute(pathname: string): string {
	if (!pathname || pathname === "/") return "/";
	const withoutQuery = pathname.split("?")[0] ?? pathname;
	if (withoutQuery.startsWith("/api/")) {
		const parts = withoutQuery.split("/").filter(Boolean);
		if (parts.length >= 3) {
			return `/${parts.slice(0, 3).join("/")}`;
		}
	}
	return withoutQuery.length > 80
		? `${withoutQuery.slice(0, 77)}...`
		: withoutQuery;
}

export function createObservability(
	options: ObservabilityOptions,
): ObservabilityBundle {
	const { service } = options;
	const registry = new Registry();
	registry.setDefaultLabels({ service });

	collectDefaultMetrics({ register: registry });

	const httpRequestDuration = new Histogram({
		name: "http_request_duration_seconds",
		help: "HTTP request duration in seconds",
		labelNames: ["method", "route", "status_code"] as const,
		registers: [registry],
		buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
	});

	const httpRequestsTotal = new Counter({
		name: "http_requests_total",
		help: "Total HTTP requests",
		labelNames: ["method", "route", "status_code"] as const,
		registers: [registry],
	});

	const logger = pino({
		level: resolveLogLevel(),
		base: { service },
	});

	const recordHttpRequest = (
		method: string,
		route: string,
		statusCode: number,
		durationSeconds: number,
	) => {
		const labels = {
			method: method.toUpperCase(),
			route: normalizeRoute(route),
			status_code: String(statusCode),
		};
		httpRequestDuration.observe(labels, durationSeconds);
		httpRequestsTotal.inc(labels);
	};

	return {
		service,
		registry,
		logger,
		httpRequestDuration,
		httpRequestsTotal,
		renderMetrics: () => registry.metrics(),
		recordHttpRequest,
	};
}

let defaultBundle: ObservabilityBundle | undefined;

export function initObservability(
	options: ObservabilityOptions,
): ObservabilityBundle {
	defaultBundle = createObservability(options);
	return defaultBundle;
}

export function getObservability(): ObservabilityBundle {
	if (!defaultBundle) {
		throw new Error(
			"Observability not initialized — call initObservability() at server startup",
		);
	}
	return defaultBundle;
}

export async function metricsHandler(): Promise<Response> {
	const bundle = getObservability();
	const body = await bundle.renderMetrics();
	return new Response(body, {
		headers: {
			"Content-Type": bundle.registry.contentType,
		},
	});
}
