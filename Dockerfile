FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

WORKDIR /app/.mastra/output
RUN cp /app/package-lock.json ./ \
	&& rm -rf node_modules \
	&& npm ci --omit=dev --no-audit --no-fund

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/.mastra/output ./
RUN mkdir -p /app/data && chown node:node /app /app/data
USER node
VOLUME ["/app/data"]
EXPOSE 4111
CMD ["node", "index.mjs"]
