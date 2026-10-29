FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Uploaded images live here; docker-compose mounts a named volume on it.
RUN mkdir -p /app/uploads
ENV NODE_ENV=production PORT=3000 UPLOAD_DIR=/app/uploads
EXPOSE 3000

# The seed is idempotent. A seed failure must not stop the API from starting.
CMD ["sh", "-c", "node seed.js; node server.js"]
