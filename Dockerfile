# Multi-stage build for React Vite application

# Base stage - common setup
FROM node:18-alpine AS base
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Development stage
FROM base AS development

# Expose port 3000
EXPOSE 3000

# Build stage
FROM base AS build

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Install serve package globally
RUN npm install -g serve

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Start production server
CMD ["serve", "-s", "dist", "-l", "3000"]
