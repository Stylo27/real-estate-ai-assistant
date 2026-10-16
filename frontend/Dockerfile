FROM node:22.23.2-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Rewrites are baked in at build time; "backend" is the compose service name.
ENV BACKEND_URL=http://backend:8000 NEXT_TELEMETRY_DISABLED=1
RUN npm run build
USER node
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
