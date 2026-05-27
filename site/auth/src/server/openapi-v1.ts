/** OpenAPI 3.1 document served at GET /api/v1/openapi.json */
export const openApiV1Document = {
	openapi: "3.1.0",
	info: {
		title: "Beskid Auth Hub API",
		version: "1.0.0",
		description:
			"Versioned HTTP API for the Beskid auth hub. Browser OAuth uses /login and /callback.",
	},
	servers: [{ url: "/api/v1", description: "Current host" }],
	paths: {
		"/health": {
			get: {
				operationId: "getHealth",
				summary: "Liveness probe",
				responses: {
					"200": {
						description: "OK",
						content: {
							"application/json": {
								schema: {
									type: "object",
									required: ["ok", "version"],
									properties: {
										ok: { type: "boolean", const: true },
										version: { type: "string", example: "v1" },
									},
								},
							},
						},
					},
				},
			},
		},
		"/me": {
			get: {
				operationId: "getMe",
				summary: "Current hub session",
				responses: {
					"200": { description: "Authenticated" },
					"401": { description: "Not signed in" },
				},
			},
		},
		"/apps": {
			get: {
				operationId: "listApps",
				summary: "Registered consumer apps",
				responses: { "200": { description: "App list" } },
			},
		},
		"/admin/status": {
			get: {
				operationId: "getAdminStatus",
				summary: "Onboarding status",
				responses: { "200": { description: "Status" } },
			},
		},
		"/admin/setup": {
			post: {
				operationId: "postAdminSetup",
				summary: "First-run onboarding",
				responses: {
					"200": { description: "Saved" },
					"400": { description: "Invalid" },
					"403": { description: "Forbidden" },
				},
			},
		},
	},
} as const;
