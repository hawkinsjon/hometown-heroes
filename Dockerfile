FROM node:18-alpine AS builder

# Create app directory
WORKDIR /app

# Install dependencies first (for better cache utilisation)
COPY package*.json ./
RUN npm ci --no-audit --progress=false

# Copy source code
COPY . .

# Build the frontend (Vite) – this outputs to /app/dist
# Vite should pick up VITE_ prefixed env vars if they are present in the build environment
RUN npm run build

# Remove dev dependencies
RUN npm prune --omit=dev

# ------------------------------
# Production image
# ------------------------------
FROM node:18-alpine AS runner
WORKDIR /app

# Copy only the necessary files from builder stage
COPY --from=builder /app .

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server/index.mjs"] 