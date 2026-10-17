import { writeFile } from 'node:fs/promises';
import pg from 'pg';
import { env } from '@/env';
import { log } from '@/log';

const schemas = ['mastra', 'observability'];
const ident = pg.escapeIdentifier;
const literal = pg.escapeLiteral;
const partmanEnabled =
	"SELECT 1 FROM pg_extension WHERE extname = 'pg_partman'";

interface Step {
	what: string;
	maintenance?: boolean;
	done?: string;
	needs?: { query: string; description: string };
	sql: string[];
}

export default async function dbSetup(): Promise<void> {
	const app = connectionUrl(env.DATABASE_URL, 'DATABASE_URL');
	const database = decodeURIComponent(app.pathname.slice(1));
	const appUser = decodeURIComponent(app.username);
	if (!database || !appUser) {
		throw new Error('DATABASE_URL must name the user and the database');
	}

	const sqlFlag = process.argv.indexOf('--sql');
	if (sqlFlag >= 0) {
		const sql = sqlScript(setupSteps(database, appUser, true), database);
		const file = process.argv[sqlFlag + 1];
		if (file) {
			await writeFile(file, sql);
			log.info(`Wrote the setup SQL to ${file}`);
		}
		else {
			process.stdout.write(sql);
		}
		return;
	}

	const admin = env.DATABASE_ADMIN_URL
		? connectionUrl(env.DATABASE_ADMIN_URL, 'DATABASE_ADMIN_URL')
		: app;
	const adminUser = decodeURIComponent(admin.username);
	const steps = setupSteps(database, appUser, adminUser !== appUser);

	log.info(`Setting up database ${database} on ${admin.host} as ${adminUser}`);
	await runSteps(
		withDatabase(admin, 'postgres'),
		steps.filter((step) => step.maintenance)
	);
	await runSteps(
		withDatabase(admin, database),
		steps.filter((step) => !step.maintenance)
	);
	log.info('Database ready; Mastra creates its tables on first start');
}

function setupSteps(
	database: string,
	appUser: string,
	grantToApp: boolean
): Step[] {
	const steps: Step[] = [
		{
			what: `database ${database}`,
			maintenance: true,
			done: `SELECT 1 FROM pg_database WHERE datname = ${literal(database)}`,
			sql: [`CREATE DATABASE ${ident(database)}`],
		},
		{
			what: 'pgvector extension',
			done: "SELECT 1 FROM pg_extension WHERE extname = 'vector'",
			sql: ['CREATE EXTENSION IF NOT EXISTS vector'],
		},
		{
			what: 'pg_partman extension',
			needs: {
				query:
					"SELECT 1 FROM pg_available_extensions WHERE name = 'pg_partman'",
				description: 'the server has pg_partman installed',
			},
			done: partmanEnabled,
			sql: [
				'CREATE SCHEMA IF NOT EXISTS partman',
				'CREATE EXTENSION IF NOT EXISTS pg_partman SCHEMA partman',
			],
		},
		...schemas.map((schema) => ({
			what: `schema ${schema}`,
			done: `SELECT 1 FROM pg_namespace WHERE nspname = ${literal(schema)}`,
			sql: [`CREATE SCHEMA IF NOT EXISTS ${ident(schema)}`],
		})),
	];

	if (grantToApp) {
		const user = ident(appUser);
		steps.push(
			{
				what: `rights for ${appUser}`,
				sql: [
					`GRANT CONNECT, TEMPORARY, CREATE ON DATABASE ${ident(database)} ` +
						`TO ${user}`,
					`GRANT USAGE, CREATE ON SCHEMA ${schemas.map(ident).join(', ')} ` +
						`TO ${user}`,
				],
			},
			{
				what: `pg_partman rights for ${appUser}`,
				needs: { query: partmanEnabled, description: 'pg_partman is enabled' },
				sql: [
					`GRANT ALL ON SCHEMA partman TO ${user}`,
					`GRANT ALL ON ALL TABLES IN SCHEMA partman TO ${user}`,
					`GRANT EXECUTE ON ALL ROUTINES IN SCHEMA partman TO ${user}`,
				],
			}
		);
	}
	return steps;
}

async function runSteps(
	connectionString: string,
	steps: Step[]
): Promise<void> {
	const client = new pg.Client({ connectionString });
	await client.connect();
	try {
		for (const step of steps) {
			if (step.needs && !(await hasRow(client, step.needs.query))) {
				log.warn(`- ${step.what}: skipped, needs ${step.needs.description}`);
				continue;
			}
			if (step.done && (await hasRow(client, step.done))) {
				log.info(`- ${step.what}: already there`);
				continue;
			}
			for (const sql of step.sql) {
				await client.query(sql);
			}
			log.info(`- ${step.what}: ${step.done ? 'created' : 'granted'}`);
		}
	}
	finally {
		await client.end();
	}
}

async function hasRow(client: pg.Client, query: string): Promise<boolean> {
	return ((await client.query(query)).rowCount ?? 0) > 0;
}

function sqlScript(steps: Step[], database: string): string {
	const lines = [
		'-- Mastra database setup, from npm run db:setup -- --sql.',
		'-- Run as an administrator with psql connected to the postgres database.',
		'-- Review optional steps and skip CREATE DATABASE if it already exists.',
		'',
	];
	let connected = false;
	for (const step of steps) {
		if (!step.maintenance && !connected) {
			lines.push(`\\connect ${ident(database)}`, '');
			connected = true;
		}
		const when = step.needs
			? ` (only if ${step.needs.description})`
			: step.maintenance
				? ' (skip if it already exists)'
				: '';
		lines.push(`-- ${step.what}${when}`, ...step.sql.map((s) => `${s};`), '');
	}
	return lines.join('\n');
}

function connectionUrl(value: string, name: string): URL {
	if (!value) {
		throw new Error(`${name} is not set; see docs/guides/database.md`);
	}
	let url: URL;
	try {
		url = new URL(value);
	}
	catch {
		throw new Error(`${name} is not a valid postgresql:// URL`);
	}
	if (!['postgresql:', 'postgres:'].includes(url.protocol) || !url.hostname) {
		throw new Error(`${name} is not a valid postgres:// URL`);
	}
	return url;
}

function withDatabase(url: URL, database: string): string {
	const copy = new URL(url);
	copy.pathname = `/${encodeURIComponent(database)}`;
	return copy.toString();
}
