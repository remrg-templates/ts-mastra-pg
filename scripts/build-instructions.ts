import { log } from '@/log';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';

/**
 * Copy markdown files from src/mastra/ to .mastra/output/ while
 * 	maintaining folder structure
 */
export default async function bundleInstructions(): Promise<void> {
	const sourceDir = 'src/mastra';
	const outputDir = '.mastra/output';

	try {
		log.info(`Copying markdown files from ${sourceDir} to ${outputDir}...`);

		// Recursively find and copy markdown files
		await copyInstructionFiles(sourceDir, outputDir);

		log.info('✓ Instruction files copied successfully');
	}
	catch (error) {
		log.error('Failed to copy instruction files:', error);
		throw error;
	}
}

async function copyInstructionFiles(
	source: string,
	destination: string
): Promise<void> {
	// Read all files and directories in source
	const entries = await fs.readdir(source, { withFileTypes: true });

	for (const entry of entries) {
		const sourcePath = join(source, entry.name);
		const destPath = join(destination, entry.name);

		if (entry.isDirectory()) {
			// Recursively process subdirectories
			await copyInstructionFiles(sourcePath, destPath);
		}
		else if (entry.isFile() && entry.name.endsWith('.instructions.md')) {
			// Copy markdown files
			log.info(`Copying: ${sourcePath} -> ${destPath}`);
			await fs.mkdir(dirname(destPath), { recursive: true });
			await fs.copyFile(sourcePath, destPath);
		}
	}
}
