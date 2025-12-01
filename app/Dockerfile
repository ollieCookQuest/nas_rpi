FROM node:20-slim

WORKDIR /app

# Install dependencies needed for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# The standalone output is in .next/standalone
# Static files are in .next/static and need to be accessible
# Next.js standalone server expects .next/static to be at the same level
# Ensure public directory exists for static assets
RUN mkdir -p .next/standalone/.next/static && \
    cp -r .next/static/* .next/standalone/.next/static/ 2>/dev/null || true

# Expose port
EXPOSE 3000

# Set environment variable for Next.js
ENV NODE_ENV=production
ENV PORT=3000

# Change to standalone directory and run server
WORKDIR /app/.next/standalone

# Start the application
CMD ["node", "server.js"]
