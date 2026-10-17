import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function readFile(filepath: string): string {
	return readFileSync(filepath, 'utf-8').toString();
}

export function mergeInstructions(...instructions: string[]): string {
	return instructions.join('\n\n');
}

function loadInstructionsFile(file: string): string {
	const cwd = process.cwd();
	let filepath = join(cwd, file);

	if (existsSync(filepath)) {
		return readFile(filepath);
	}

	filepath = join(cwd, '../', file);

	if (existsSync(filepath)) {
		return readFile(filepath);
	}

	throw new Error(`Instructions file not found: ${file}`);
}

function loadGlobalInstructions(): string {
	return loadInstructionsFile('instructions/global.instructions.md');
}

function loadAgentInstructions(file: string): string {
	return loadInstructionsFile(join('agents', file));
}

export function loadInstructions(file: string): string {
	return mergeInstructions(
		loadGlobalInstructions(),
		loadAgentInstructions(file)
	);
}
