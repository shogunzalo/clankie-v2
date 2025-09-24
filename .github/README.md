# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the Clankie API project. These workflows provide comprehensive CI/CD, testing, security scanning, and deployment automation.

## 📋 Workflows Overview

### 🔄 **CI/CD Pipeline** (`ci.yml`)
**Triggers:** Push to main/develop, Pull requests
**Purpose:** Main continuous integration and deployment pipeline

**Jobs:**
- **Test**: Runs tests on Node.js 18.x and 20.x with PostgreSQL 15
- **Security**: Security audit and vulnerability scanning
- **Build**: Application build and artifact creation
- **Deploy Staging**: Automatic deployment to staging on develop branch
- **Deploy Production**: Manual deployment to production on main branch
- **Notify**: Success/failure notifications

### 🧪 **Test Matrix** (`test-matrix.yml`)
**Triggers:** Push to main/develop, Pull requests, Daily schedule
**Purpose:** Comprehensive testing across multiple Node.js and PostgreSQL versions

**Matrix:**
- **Node.js**: 18.x, 20.x, 21.x
- **PostgreSQL**: 14, 15, 16
- **Test Types**: Unit, Integration, E2E

### 🤖 **AI & Security Testing** (`ai-security.yml`)
**Triggers:** Push to main/develop, Pull requests, Weekly schedule
**Purpose:** AI-specific testing and security scanning

**Jobs:**
- **AI Tests**: AI integration tests and security guardrail validation
- **Security Scan**: npm audit, Snyk, CodeQL analysis
- **Dependency Check**: Outdated dependencies and vulnerability scanning

### ⚡ **Performance Testing** (`performance.yml`)
**Triggers:** Push to main, Pull requests, Weekly schedule
**Purpose:** Performance and load testing

**Jobs:**
- **Performance Tests**: AI processing speed, database performance, memory usage
- **Load Testing**: API load testing with Artillery (weekly only)

### 📊 **Code Quality** (`code-quality.yml`)
**Triggers:** Push to main/develop, Pull requests
**Purpose:** Code quality checks and test coverage

**Jobs:**
- **Code Quality**: ESLint, Prettier, formatting checks, dependency analysis
- **Test Coverage**: Coverage reports and PR comments

### 🚀 **Deploy** (`deploy.yml`)
**Triggers:** Push to main, Manual dispatch
**Purpose:** Production deployment with rollback capabilities

**Jobs:**
- **Deploy Staging**: Automatic staging deployment
- **Deploy Production**: Manual production deployment with approval
- **Rollback**: Automatic rollback on deployment failure

## 🔧 Configuration

### Environment Variables

The workflows use the following environment variables:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=clankie_test_db

# Application
NODE_ENV=test
PORT=3000
JWT_SECRET=test_jwt_secret_key_for_ci_cd_pipeline

# External Services
OPENAI_API_KEY=test_openai_key
INSTAGRAM_TEST_TOKEN=test_instagram_token
VERIFY_TOKEN=test_verify_token
```

### Required Secrets

Add these secrets to your GitHub repository:

- `SNYK_TOKEN`: For Snyk security scanning (optional)
- `GITHUB_TOKEN`: Automatically provided by GitHub

### Required Environments

Create these environments in your GitHub repository:

- `staging`: For staging deployments
- `production`: For production deployments (with protection rules)

## 📊 Workflow Status

### ✅ **Success Criteria**
- All tests pass (unit, integration, e2e)
- Security scans show no high/critical vulnerabilities
- Code quality checks pass
- Performance tests meet benchmarks
- AI security guardrails function correctly

### ⚠️ **Warning Conditions**
- Some dependencies are outdated
- Low test coverage (< 80%)
- Performance degradation detected
- Security vulnerabilities (medium/low severity)

### ❌ **Failure Conditions**
- Any test fails
- High/critical security vulnerabilities
- Code quality issues (formatting, linting)
- Deployment failures
- Health checks fail

## 🚀 Usage

### Automatic Triggers
- **Push to main**: Runs full CI/CD pipeline
- **Push to develop**: Runs tests and deploys to staging
- **Pull Request**: Runs tests and code quality checks
- **Daily Schedule**: Runs comprehensive test matrix and security scans
- **Weekly Schedule**: Runs performance and load tests

### Manual Triggers
- **Deploy to Production**: Use workflow dispatch to deploy to production
- **Rollback**: Automatic rollback on deployment failure

### Local Testing
To run the same tests locally:

```bash
# Install dependencies
npm ci

# Set up test environment
cp .env.example .env.test

# Run database migrations
npm run migrate

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Clean up
npm run migrate:undo:all
```

## 📈 Monitoring

### Workflow Metrics
- **Test Success Rate**: Track test pass/fail rates
- **Deployment Frequency**: Monitor deployment cadence
- **Performance Trends**: Track performance over time
- **Security Posture**: Monitor vulnerability trends

### Notifications
- **Success**: Team notifications on successful deployments
- **Failure**: Immediate alerts on test failures or deployment issues
- **Security**: Alerts on new vulnerabilities

## 🔒 Security Features

### AI Security Guardrails
- **Prompt Injection Protection**: Filters malicious input patterns
- **Rate Limiting**: Prevents abuse with per-user limits
- **Input Sanitization**: Cleans user input before processing
- **Response Validation**: Validates AI responses for safety

### Code Security
- **Dependency Scanning**: Regular vulnerability checks
- **Secret Detection**: Scans for hardcoded secrets
- **CodeQL Analysis**: Static code analysis for security issues
- **Audit Logging**: Security event tracking

## 📝 Best Practices

### Development
1. **Write Tests**: Ensure all new features have tests
2. **Follow Standards**: Use consistent code formatting
3. **Security First**: Consider security implications
4. **Performance**: Monitor performance impact

### Deployment
1. **Test First**: All tests must pass before deployment
2. **Staging First**: Deploy to staging before production
3. **Monitor**: Watch deployment and health checks
4. **Rollback Ready**: Be prepared to rollback if needed

### Maintenance
1. **Regular Updates**: Keep dependencies updated
2. **Security Scans**: Review security reports regularly
3. **Performance Monitoring**: Track performance metrics
4. **Documentation**: Keep workflows documented

## 🆘 Troubleshooting

### Common Issues

**Tests Failing:**
- Check database connection
- Verify environment variables
- Review test data setup

**Deployment Issues:**
- Check environment configuration
- Verify secrets are set
- Review deployment logs

**Performance Issues:**
- Check resource usage
- Review database queries
- Monitor memory usage

**Security Alerts:**
- Review vulnerability details
- Update affected dependencies
- Test security fixes

### Getting Help
- Check workflow logs for detailed error messages
- Review GitHub Actions documentation
- Contact the development team for assistance

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Jest Testing Framework](https://jestjs.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
