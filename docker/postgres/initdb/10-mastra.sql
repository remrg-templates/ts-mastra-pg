-- Runs only when the PostgreSQL data volume is initialized.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE SCHEMA IF NOT EXISTS partman;
CREATE EXTENSION IF NOT EXISTS pg_partman SCHEMA partman;
CREATE SCHEMA IF NOT EXISTS mastra;
CREATE SCHEMA IF NOT EXISTS observability;
