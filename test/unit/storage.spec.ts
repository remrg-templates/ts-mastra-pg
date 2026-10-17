import { afterEach, describe, expect, it, vi } from 'vitest';

const { environment, createStore } = vi.hoisted(() => ({
	environment: {
		DATABASE_URL: '',
		OBSERVABILITY_DATABASE_URL: '',
	},
	createStore: vi.fn(),
}));

vi.mock('@/env', () => ({ env: environment }));
vi.mock('@mastra/pg', () => ({
	PostgresStoreVNext: class {
		constructor(config: object) {
			createStore(config);
		}
	},
}));

afterEach(() => {
	environment.DATABASE_URL = '';
	environment.OBSERVABILITY_DATABASE_URL = '';
	vi.clearAllMocks();
	vi.resetModules();
});

describe('PostgreSQL storage', () => {
	it('reports a missing application connection', async () => {
		await expect(import('@/mastra/storage')).rejects.toThrow(
			'DATABASE_URL is not set'
		);
		expect(createStore).not.toHaveBeenCalled();
	});

	it('reports a missing observability connection', async () => {
		environment.DATABASE_URL = 'postgresql://app@postgres/app';
		await expect(import('@/mastra/storage')).rejects.toThrow(
			'OBSERVABILITY_DATABASE_URL is not set'
		);
		expect(createStore).not.toHaveBeenCalled();
	});

	it('uses explicit connections and separate schemas', async () => {
		environment.DATABASE_URL = 'postgresql://app@postgres/app';
		environment.OBSERVABILITY_DATABASE_URL =
			'postgresql://app@postgres/metrics';
		await import('@/mastra/storage');
		expect(createStore).toHaveBeenCalledWith({
			id: 'mastra-storage',
			connectionString: environment.DATABASE_URL,
			schemaName: 'mastra',
			observability: {
				connectionString: environment.OBSERVABILITY_DATABASE_URL,
				schemaName: 'observability',
			},
		});
	});
});
