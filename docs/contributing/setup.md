# Setup Guide

## Install dev tools

- node

## Install node modules

- `npm i`

## Environment Variables

See `src/env.ts` to see how to use this project's environment variables.

### Create .env file

Copy the `.env.example` file to `.env` and update the values as needed.

```bash
cp .env.example .env
```

## Build

- `npm run build`
- `npm start`

## Development

- `npm run dev`
- View the [Development Guide](./development.md)

## Docker

### Database Configuration

If you don't have a `.env` file already, run `cp .env.example .env`.

Set the following in your `.env`:

- `POSTGRES_DB`: initial database name.
- `POSTGRES_USER`: initial administrative user.
- `POSTGRES_PASSWORD`: a unique, non-empty password. No default is provided.

### Startup

Run docker compose to start:

```
docker compose up --build -d
```

Open `http://localhost:4111` (or the port set in `.env`). See the [Deployment Guide](./deploy.md) for container details.
