#!/bin/bash

# Script para detener todos los microservicios

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Stopping all microservices...${NC}"

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        kill $pid 2>/dev/null
        echo -e "${GREEN}✓ Stopped service on port $port (PID: $pid)${NC}"
    else
        echo -e "${BLUE}  No service running on port $port${NC}"
    fi
}

# Kill services
kill_port 50051  # Auth Service
kill_port 50052  # User Service
kill_port 8080   # API Gateway

echo -e "${GREEN}All services stopped${NC}"
