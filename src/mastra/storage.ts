import { PostgresStoreVNext } from '@mastra/pg';
import { env } from '@/env';

if (!env.DATABASE_URL) {
	throw new Error(
		'DATABASE_URL is not set; see docs/guides/database.md to set up Postgres'
	);
}

if (!env.OBSERVABILITY_DATABASE_URL) {
	throw new Error(
		'OBSERVABILITY_DATABASE_URL is not set; ' +
			'see docs/guides/database.md to set up Postgres'
	);
}

export const storage = new PostgresStoreVNext({
	id: 'mastra-storage',
	connectionString: env.DATABASE_URL,
	schemaName: 'mastra',
	observability: {
		connectionString: env.OBSERVABILITY_DATABASE_URL,
		schemaName: 'observability',
	},
});
