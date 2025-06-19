#!/usr/bin/env bash
# exit on error
set -o errexit

# Install root dependencies
npm install

# Install client dependencies
cd client
npm install --legacy-peer-deps

# Build the React app
npm run build

# Go back to root
cd ..

echo "Build completed successfully!" 