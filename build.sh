#!/bin/bash
set -e

echo "Starting build process..."

# Install dependencies using bun
echo "Installing dependencies with bun..."
bun install 2>&1

# Build the application
echo "Building the application..."
bun run build 2>&1

echo "Build completed successfully!"
