#!/bin/bash

# Script para iniciar todos los microservicios

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Starting DeliveryApp Microservices       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${RED}Port $1 is already in use${NC}"
        return 1
    fi
    return 0
}

# Check ports
echo -e "${BLUE}Checking ports...${NC}"
check_port 50051 || exit 1
check_port 50052 || exit 1
check_port 8080 || exit 1

echo -e "${GREEN}All ports available!${NC}"
echo ""

# Start Auth Service
echo -e "${BLUE}[1/3] Starting Auth Service on :50051${NC}"
cd auth-service && go run main.go > ../logs/auth-service.log 2>&1 &
AUTH_PID=$!
echo -e "${GREEN}✓ Auth Service started (PID: $AUTH_PID)${NC}"
sleep 2

# Start User Service
echo -e "${BLUE}[2/3] Starting User Service on :50052${NC}"
cd ../user-service && go run main.go > ../logs/user-service.log 2>&1 &
USER_PID=$!
echo -e "${GREEN}✓ User Service started (PID: $USER_PID)${NC}"
sleep 2

# Start API Gateway
echo -e "${BLUE}[3/3] Starting API Gateway on :8080${NC}"
cd ../api-gateway && go run main.go > ../logs/api-gateway.log 2>&1 &
GATEWAY_PID=$!
echo -e "${GREEN}✓ API Gateway started (PID: $GATEWAY_PID)${NC}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  All services started successfully! 🚀     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Services:${NC}"
echo -e "  • Auth Service:  ${GREEN}localhost:50051${NC} (PID: $AUTH_PID)"
echo -e "  • User Service:  ${GREEN}localhost:50052${NC} (PID: $USER_PID)"
echo -e "  • API Gateway:   ${GREEN}localhost:8080${NC}  (PID: $GATEWAY_PID)"
echo ""
echo -e "${BLUE}API Endpoints:${NC}"
echo -e "  • Login:         ${GREEN}POST http://localhost:8080/api/auth/login${NC}"
echo -e "  • Register:      ${GREEN}POST http://localhost:8080/api/users${NC}"
echo -e "  • Health Check:  ${GREEN}GET  http://localhost:8080/health${NC}"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo -e "  • Auth Service:  logs/auth-service.log"
echo -e "  • User Service:  logs/user-service.log"
echo -e "  • API Gateway:   logs/api-gateway.log"
echo ""
echo -e "${RED}Press Ctrl+C to stop all services${NC}"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${BLUE}Stopping services...${NC}"
    kill $AUTH_PID 2>/dev/null
    kill $USER_PID 2>/dev/null
    kill $GATEWAY_PID 2>/dev/null
    echo -e "${GREEN}All services stopped${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Wait for services
wait
