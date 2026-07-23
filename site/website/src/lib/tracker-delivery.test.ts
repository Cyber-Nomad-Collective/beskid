import assert from 'node:assert/strict';
import test from 'node:test';

import { fetchLatestDelivery } from './tracker-delivery.ts';

test('normalizes Tracker latest delivery to a download label', async () => {
	const fetcher = async () =>
		Response.json({
			version: '0.5.0',
			catalogRevision: 'catalog-5',
		});

	assert.deepEqual(await fetchLatestDelivery(fetcher, 'https://tracker.example.test'), {
		version: '0.5.0',
		downloadLabel: 'Beskid 0.5.0',
	});
});

test('rejects malformed latest-delivery payloads', async () => {
	const fetcher = async () => Response.json({ version: 'not-a-version' });

	await assert.rejects(
		() => fetchLatestDelivery(fetcher, 'https://tracker.example.test'),
		/Tracker latest delivery payload is malformed/,
	);
});

test('normalizes invalid Tracker JSON into a malformed-payload error', async () => {
	const fetcher = async () => new Response('not JSON', { status: 200 });

	await assert.rejects(
		() => fetchLatestDelivery(fetcher, 'https://tracker.example.test'),
		/Tracker latest delivery payload is malformed/,
	);
});

test('preserves Tracker HTTP failures', async () => {
	const fetcher = async () => new Response('temporarily unavailable', { status: 503 });

	await assert.rejects(
		() => fetchLatestDelivery(fetcher, 'https://tracker.example.test'),
		/Tracker latest delivery request failed \(503\)/,
	);
});
