#!/bin/bash
set -e

echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Install global dependencies
echo "Installing global dependencies..."
npm install -g pm2

# Build the application
echo "Building the application..."
npm run build

echo "Build completed successfully!"
