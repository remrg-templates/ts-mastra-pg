import { Agent } from '@mastra/core/agent';
import { TaskSignalProvider } from '@mastra/core/signals';
import { Memory } from '@mastra/memory';

import { defaultAgentMemoryOptions } from '../../agent-options';
import { loadInstructions } from '../../instructions/load-instructions';
import { models } from '../../models';
import { defaultAgentOptions } from '../../agent-options';
import {
	askUserTool,
	scheduleTools,
	webFetchTool,
	webSearchTool,
} from '../../tools';

export const agent = new Agent({
	id: 'agent',
	name: 'Agent',
	description:
		'A general-purpose assistant that can research, manage \
tasks, work with local files, run approved commands, and \
create recurring schedules.',
	metadata: {
		suggestedPrompts: [
			"What's the weather in Austin this weekend?",
			"What's the SPCX stock price right now?",
			'Build a Japanese sakura festival landing page.',
		],
	},
	instructions: loadInstructions('agent/agent.instructions.md'),
	model: models.chat.lg,
	defaultOptions: defaultAgentOptions,
	memory: new Memory({
		options: defaultAgentMemoryOptions,
	}),
	tools: {
		...scheduleTools,
		ask_user: askUserTool,
		web_fetch: webFetchTool,
		web_search: webSearchTool,
	},
	signals: [new TaskSignalProvider()],
});
