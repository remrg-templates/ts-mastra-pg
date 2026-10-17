import { AppConfig, configure } from 'ts-appconfig';

/**
 * Environment Variables Schema
 */
export class Environment extends AppConfig {
	readonly APP_TITLE = '{{ remrg:var project-name }}';

	readonly PORT = 4111;

	readonly OPENAI_API_KEY = '';

	readonly LOCAL_MODEL_URL = 'http://localhost:11434/v1';
	readonly LOCAL_STABLEDIFFUSION_URL = 'http://localhost:7860/api/txt2img';
}

/**
 * Load & export environment variables
 */
export const env: Environment = configure(Environment);
