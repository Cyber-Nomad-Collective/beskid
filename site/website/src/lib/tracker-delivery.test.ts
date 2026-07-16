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
