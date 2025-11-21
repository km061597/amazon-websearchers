#!/bin/bash
#
# SmartAmazon Demo - Development Startup Script
# Usage: ./dev.sh [--backend-only] [--frontend-only]
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/smartamazon-demo"

# Parse arguments
BACKEND_ONLY=false
FRONTEND_ONLY=false
for arg in "$@"; do
  case $arg in
    --backend-only) BACKEND_ONLY=true ;;
    --frontend-only) FRONTEND_ONLY=true ;;
    --help|-h)
      echo "Usage: ./dev.sh [--backend-only] [--frontend-only]"
      exit 0
      ;;
  esac
done

print_header() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  SmartAmazon Demo - Development Server${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if a port is in use
port_in_use() {
  if command -v lsof &> /dev/null; then
    lsof -i :"$1" &> /dev/null
  elif command -v netstat &> /dev/null; then
    netstat -tuln 2>/dev/null | grep -q ":$1 "
  else
    # Fallback: try to connect
    (echo > /dev/tcp/localhost/$1) 2>/dev/null
  fi
}

# Kill process on port
kill_port() {
  local port=$1
  if command -v lsof &> /dev/null; then
    local pid=$(lsof -t -i :$port 2>/dev/null)
    if [ -n "$pid" ]; then
      log_warn "Killing existing process on port $port (PID: $pid)"
      kill $pid 2>/dev/null || true
      sleep 1
    fi
  fi
}

# Load environment files
load_env() {
  local env_file=$1
  if [ -f "$env_file" ]; then
    log_info "Loading $env_file"
    set -a
    source "$env_file"
    set +a
  fi
}

# Initialize backend
init_backend() {
  log_info "Initializing backend..."
  cd "$BACKEND_DIR"

  # Load backend .env
  load_env "$BACKEND_DIR/.env"

  # Set SQLite as default for demo
  export DATABASE_URL="${DATABASE_URL:-sqlite:///./smartamazon.db}"

  # Initialize database if missing
  if [[ "$DATABASE_URL" == sqlite* ]]; then
    local db_file=$(echo "$DATABASE_URL" | sed 's|sqlite:///||' | sed 's|^./||')
    if [ ! -f "$db_file" ]; then
      log_info "Creating SQLite database..."
      python -c "
from app.database import init_db
from app.init_data import init_sample_data
init_db()
init_sample_data()
"
    else
      log_info "Database already exists: $db_file"
    fi
  fi
}

# Start backend server
start_backend() {
  log_info "Starting backend on port $BACKEND_PORT..."
  cd "$BACKEND_DIR"

  # Kill existing process if running
  if port_in_use $BACKEND_PORT; then
    kill_port $BACKEND_PORT
  fi

  # Start uvicorn
  uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload &
  BACKEND_PID=$!

  # Wait for backend to be ready
  log_info "Waiting for backend to start..."
  for i in {1..30}; do
    if curl -s "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
      log_info "Backend ready!"
      return 0
    fi
    sleep 1
  done

  log_error "Backend failed to start within 30 seconds"
  return 1
}

# Initialize frontend
init_frontend() {
  log_info "Initializing frontend..."
  cd "$FRONTEND_DIR"

  # Load frontend .env
  load_env "$FRONTEND_DIR/.env"
  load_env "$FRONTEND_DIR/.env.local"

  # Set API URL
  export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:$BACKEND_PORT/api}"

  # Check if node_modules exists
  if [ ! -d "node_modules" ]; then
    log_info "Installing frontend dependencies..."
    npm install
  fi
}

# Start frontend server
start_frontend() {
  log_info "Starting frontend on port $FRONTEND_PORT..."
  cd "$FRONTEND_DIR"

  # Kill existing process if running
  if port_in_use $FRONTEND_PORT; then
    kill_port $FRONTEND_PORT
  fi

  # Start Next.js dev server
  npm run dev &
  FRONTEND_PID=$!

  # Wait for frontend to be ready
  log_info "Waiting for frontend to start..."
  for i in {1..60}; do
    if curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
      log_info "Frontend ready!"
      return 0
    fi
    sleep 1
  done

  log_warn "Frontend may still be compiling..."
  return 0
}

# Print status
print_status() {
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  Services Running${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  if [ "$FRONTEND_ONLY" = false ]; then
    echo -e "  ${BLUE}Backend API:${NC}    http://localhost:$BACKEND_PORT"
    echo -e "  ${BLUE}API Docs:${NC}       http://localhost:$BACKEND_PORT/api/docs"
    echo -e "  ${BLUE}Health Check:${NC}   http://localhost:$BACKEND_PORT/health"
  fi

  if [ "$BACKEND_ONLY" = false ]; then
    echo ""
    echo -e "  ${BLUE}Frontend:${NC}       http://localhost:$FRONTEND_PORT"
    echo -e "  ${BLUE}Products Page:${NC}  http://localhost:$FRONTEND_PORT/products"
  fi

  echo ""
  echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
  echo ""
}

# Cleanup on exit
cleanup() {
  echo ""
  log_info "Shutting down services..."

  [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null
  [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null

  # Kill any remaining processes on our ports
  kill_port $BACKEND_PORT
  kill_port $FRONTEND_PORT

  log_info "Goodbye!"
  exit 0
}

# Main
main() {
  print_header

  # Set up cleanup trap
  trap cleanup SIGINT SIGTERM

  # Backend
  if [ "$FRONTEND_ONLY" = false ]; then
    init_backend
    start_backend
  fi

  # Frontend
  if [ "$BACKEND_ONLY" = false ]; then
    init_frontend
    start_frontend
  fi

  print_status

  # Wait for processes
  wait
}

main "$@"
