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

	readonly DATABASE_URL: string = '';
	readonly OBSERVABILITY_DATABASE_URL: string = '';

	// Used only by db:setup when the application's user cannot provision the database.
	readonly DATABASE_ADMIN_URL: string = '';
}

/**
 * Load & export environment variables
 */
export const env: Environment = configure(Environment);
