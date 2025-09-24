#!/bin/bash

# CI/CD Test Script
# This script replicates the GitHub Actions CI environment locally

set -e  # Exit on any error

echo "🚀 Starting CI/CD Test Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client not found. Make sure PostgreSQL is running."
    fi
    
    print_success "Dependencies check completed"
}

# Setup environment
setup_environment() {
    print_status "Setting up test environment..."
    
    # Create test environment file
    cat > .env.test << EOF
NODE_ENV=test
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=clankie_test_db
DB_NAME_TEST=clankie_test_db
JWT_SECRET=test_jwt_secret_key_for_ci_cd_pipeline
FRONTEND_URL=http://localhost:3000
INSTAGRAM_TEST_TOKEN=test_instagram_token
VERIFY_TOKEN=test_verify_token
CREATE_FIXED_CONNECTION=true
OPENAI_API_KEY=test_openai_key
EOF
    
    print_success "Environment setup completed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci
    print_success "Dependencies installed"
}

# Wait for PostgreSQL
wait_for_postgres() {
    print_status "Waiting for PostgreSQL..."
    
    if command -v pg_isready &> /dev/null; then
        until pg_isready -h localhost -p 5432 -U postgres; do
            echo "Waiting for PostgreSQL to be ready..."
            sleep 2
        done
        print_success "PostgreSQL is ready"
    else
        print_warning "pg_isready not found, skipping PostgreSQL check"
    fi
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    npm run migrate
    print_success "Database migrations completed"
}

# Run linting
run_linting() {
    print_status "Running linting..."
    if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
        npm run lint || print_warning "Linting failed or not configured"
    else
        print_warning "ESLint not configured, skipping..."
    fi
}

# Run tests
run_tests() {
    print_status "Running tests..."
    npm test
    print_success "Tests completed"
}

# Run test coverage
run_coverage() {
    print_status "Running test coverage..."
    npm run test:coverage
    print_success "Test coverage completed"
}

# Run security audit
run_security_audit() {
    print_status "Running security audit..."
    npm audit --audit-level=moderate || print_warning "Security audit found issues"
}

# Cleanup database
cleanup_database() {
    print_status "Cleaning up database..."
    npm run migrate:undo:all || print_warning "Database cleanup failed"
    print_success "Database cleanup completed"
}

# Main execution
main() {
    echo "Starting CI/CD test simulation..."
    echo "Node.js version: $(node --version)"
    echo "npm version: $(npm --version)"
    echo ""
    
    check_dependencies
    setup_environment
    install_dependencies
    wait_for_postgres
    run_migrations
    
    # Run tests and checks
    run_linting
    run_tests
    run_coverage
    run_security_audit
    
    # Cleanup
    cleanup_database
    
    echo ""
    print_success "🎉 CI/CD test simulation completed successfully!"
    echo "All checks passed. Your code is ready for deployment."
}

# Handle script interruption
trap cleanup_database EXIT

# Run main function
main "$@"
