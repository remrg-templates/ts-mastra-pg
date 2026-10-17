import { Mastra } from '@mastra/core/mastra';
import { MastraEditor } from '@mastra/editor';
import {
	MastraStorageExporter,
	MastraPlatformExporter,
	Observability,
	SensitiveDataFilter,
} from '@mastra/observability';
import { agent } from './agents/agent/agent';
import { startScheduleTool, stopScheduleTool } from './tools/schedule-tools';
import { storage } from './storage';

export const mastra = new Mastra({
	agents: { agent },
	tools: { startScheduleTool, stopScheduleTool },
	storage,
	observability: new Observability({
		configs: {
			default: {
				serviceName: 'mastra',
				exporters: [new MastraStorageExporter(), new MastraPlatformExporter()],
				spanOutputProcessors: [new SensitiveDataFilter()],
			},
		},
	}),
	editor: new MastraEditor(),
});
