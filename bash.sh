#!/bin/bash

# Exit on any error
set -e

echo "======================================"
echo "    TaskFlow Setup & Run Script"
echo "======================================"
echo ""

echo "🔧 Installing Backend Dependencies..."
cd backend
npm install
cd ..

echo "🔧 Installing Frontend Dependencies..."
npm install

echo ""
echo "🚀 Starting TaskFlow Application..."
echo "======================================"

# Start backend in the background
echo "Starting Backend API Server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Start frontend in the foreground
echo "Starting Frontend Development Server..."
npm run dev

# If the frontend is stopped (Ctrl+C), kill the background backend process
trap "kill $BACKEND_PID" EXIT
