import { afterEach, describe, expect, it, vi } from 'vitest';
import { writeFile } from 'node:fs/promises';
import dbSetup from '../../scripts/db-setup';

const { environment } = vi.hoisted(() => ({
	environment: {
		DATABASE_URL: '',
		DATABASE_ADMIN_URL: '',
	},
}));

vi.mock('@/env', () => ({ env: environment }));
vi.mock('@/log', () => ({
	log: { info: vi.fn(), warn: vi.fn() },
}));
vi.mock('node:fs/promises', () => ({ writeFile: vi.fn() }));

const originalArgv = process.argv;

afterEach(() => {
	process.argv = originalArgv;
	environment.DATABASE_URL = '';
	environment.DATABASE_ADMIN_URL = '';
	vi.clearAllMocks();
});

describe('database setup', () => {
	it.each([
		'',
		'not a URL',
		'https://example.com/app',
		'postgresql://host/app',
	])(
		'rejects invalid or incomplete connection configuration: %s',
		async (url) => {
			environment.DATABASE_URL = url;
			await expect(dbSetup()).rejects.toThrow('DATABASE_URL');
		}
	);

	it('exports quoted SQL without connecting to the database', async () => {
		environment.DATABASE_URL =
			'postgresql://app%22user:secret@localhost/app%22db';
		process.argv = ['node', 'db-setup.ts', '--sql', 'setup.sql'];
		await dbSetup();
		expect(writeFile).toHaveBeenCalledOnce();
		const [file, sql] = vi.mocked(writeFile).mock.calls[0]!;
		expect(file).toBe('setup.sql');
		expect(sql).toContain('CREATE DATABASE "app""db";');
		expect(sql).toContain('\\connect "app""db"');
		expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS vector;');
		expect(sql).toContain(
			'CREATE EXTENSION IF NOT EXISTS pg_partman SCHEMA partman;'
		);
		expect(sql).toContain('CREATE SCHEMA IF NOT EXISTS "observability";');
		expect(sql).toContain('TO "app""user";');
		expect(sql).not.toContain('secret');
	});
});
