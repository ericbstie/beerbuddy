FROM oven/bun:latest

WORKDIR /app

# Install OpenSSL (required for Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json bun.lockb* ./
RUN bun install

# Copy Prisma files and generate client (no DB connection needed)
COPY prisma ./prisma
RUN DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy" bunx prisma generate

# Copy application code
COPY . .

EXPOSE 3000

# Run migrations then start server
CMD bunx prisma migrate deploy && bun run index.ts

