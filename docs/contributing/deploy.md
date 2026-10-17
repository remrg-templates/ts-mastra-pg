# Deployment Guide

## Local Container

Copy `.env.example` to `.env` and set the values required by your app, such as
`OPENAI_API_KEY`. Any local model service URLs must be reachable from inside the
container.

Build and start the app:

```bash
docker compose up --build -d --wait
```

The image builds the Mastra output in a separate stage, then runs it as the
non-root `node` user. The app defaults to port `4111`; set `PORT` in `.env` to
choose another port. Compose uses this value for both the app and its host port,
and binds it to `127.0.0.1`. Do not expose it publicly without an explicit
authentication and access control design.
