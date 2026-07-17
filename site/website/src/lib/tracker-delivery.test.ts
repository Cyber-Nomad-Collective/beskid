import { expect, test } from 'bun:test';

import { fetchLatestDelivery } from './tracker-delivery';

test('normalizes Tracker latest delivery to a download label', async () => {
	const fetcher = async () =>
		Response.json({
			version: '0.5.0',
			catalogRevision: 'catalog-5',
		});

	await expect(fetchLatestDelivery(fetcher, 'https://tracker.example.test')).resolves.toEqual({
		version: '0.5.0',
		downloadLabel: 'Beskid 0.5.0',
	});
});

test('rejects malformed latest-delivery payloads', async () => {
	const fetcher = async () => Response.json({ version: 'not-a-version' });

	await expect(fetchLatestDelivery(fetcher, 'https://tracker.example.test')).rejects.toThrow(
		'Tracker latest delivery payload is malformed',
	);
});

test('normalizes invalid Tracker JSON into a malformed-payload error', async () => {
	const fetcher = async () => new Response('not JSON', { status: 200 });

	await expect(fetchLatestDelivery(fetcher, 'https://tracker.example.test')).rejects.toThrow(
		'Tracker latest delivery payload is malformed',
	);
});

test('preserves Tracker HTTP failures', async () => {
	const fetcher = async () => new Response('temporarily unavailable', { status: 503 });

	await expect(fetchLatestDelivery(fetcher, 'https://tracker.example.test')).rejects.toThrow(
		'Tracker latest delivery request failed (503)',
	);
});
