# One-shot Database Migration & Seed Runner for Digital Dean's Office
FROM node:20-alpine

WORKDIR /app

# OpenSSL required for Prisma engines on Alpine Linux
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci && npm install --no-save tsx

COPY schema.prisma ./
COPY migrations ./migrations
COPY seed.ts ./

RUN npx prisma generate --schema=schema.prisma

CMD ["sh", "-c", "npx prisma migrate deploy --schema=schema.prisma && npx tsx seed.ts"]
