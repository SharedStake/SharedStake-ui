# Infrastructure Improvements Documentation

## Overview

This document describes the infrastructure improvements made to SharedStake V2 to improve production readiness from 95% to optimal state with minimal, essential infrastructure.

## Changes Made

### Security Improvements
- **Dependency Updates**: Updated axios, vite, and postcss to resolve critical security vulnerabilities
  - axios: Fixed SSRF, prototype pollution, and redirect bypass vulnerabilities
  - vite: Fixed path traversal and XSS vulnerabilities
  - postcss: Fixed security issues

### Documentation Updates
- **FAQ**: Updated from outdated V1 information to accurate V2 documentation with links to the new docs center
- **Consolidated Documentation**: Merged multiple verbose docs into a single concise README.md

### Infrastructure Automation
- **Consolidated Deployment Script**: `scripts/deploy.sh` handles contracts, services, and backups
- **Docker Setup**: Simplified docker-compose.yml for postgres and referral service
- **CI/CD Pipeline**: Streamlined GitHub Actions workflow for testing and building

### Environment Configuration
- **Unified Environment Template**: Single `.env.production.example` for all required variables

## Architecture

### Docker Services
```
┌─────────────────┐
│  Referral Service│
│  (Port 3001)     │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │
│  (Port 5432)    │
└─────────────────┘
```

### Deployment Workflow
```
1. Deploy Contracts → SharedDeposit hardhat deploy
2. Deploy Services → docker-compose up -d
3. Backup → ./scripts/deploy.sh backup
```

## Operational Procedures

### Initial Setup
1. Copy environment template: `cp .env.production.example .env.production`
2. Fill in required values (RPC URLs, contract addresses, database credentials)
3. Run `./scripts/deploy.sh contracts` to deploy smart contracts
4. Run `./scripts/deploy.sh services` to start Docker services
5. Configure DNS and SSL for production

### Daily Operations
- **Health Checks**: `curl http://localhost:3001/health`
- **Backups**: `./scripts/deploy.sh backup` (runs automatically via cron in production)
- **Log Monitoring**: `docker-compose logs -f referral-service`

### Deployment
- **Contract Updates**: `./scripts/deploy.sh contracts` (after contract changes)
- **Service Updates**: `docker-compose up -d --build` (after code changes)
- **Rollback**: `git revert <commit>` then redeploy

## Troubleshooting

### Service Won't Start
```bash
# Check logs
docker-compose logs referral-service

# Check database connection
docker-compose exec postgres pg_isready -U sharedstake

# Restart service
docker-compose restart referral-service
```

### Database Issues
```bash
# Check connection
docker-compose exec postgres psql -U sharedstake -d sharedstake_referral

# Restore from backup
gunzip < backups/postgres/db_YYYYMMDD_HHMMSS.sql.gz | docker-compose exec -T postgres psql -U sharedstake -d sharedstake_referral
```

### Build Failures
```bash
# Clean and rebuild
bun run clean
bun install
bun run build
```

## Monitoring

### Health Checks
- Referral Service: `GET /health` endpoint
- Database: PostgreSQL health check in docker-compose

### Logs
- Application logs: `docker-compose logs referral-service`
- Database logs: `docker-compose logs postgres`

### Metrics
Currently using basic health checks. Advanced monitoring can be added with Prometheus/Grafana if needed.

## Security Considerations

### Database Security
- Change default POSTGRES_PASSWORD in production
- Use strong DATABASE_URL credentials
- Limit database access to localhost only
- Enable SSL for database connections in production

### Service Security
- Use environment variables for sensitive data
- Never commit .env files
- Rotate API keys regularly
- Keep dependencies updated

### Network Security
- Use firewall rules to restrict ports
- Enable SSL/TLS for all endpoints
- Use VPN for production access
- Implement rate limiting

## Backup Strategy

### Automated Backups
- Location: `./backups/postgres/`
- Schedule: Daily via cron (recommended)
- Retention: 30 days
- Format: Gzipped SQL dumps

### Manual Backup
```bash
./scripts/deploy.sh backup
```

### Restore Procedure
```bash
# Stop services
docker-compose down

# Restore database
gunzip < backups/postgres/db_YYYYMMDD_HHMMSS.sql.gz | docker-compose exec -T postgres psql -U sharedstake -d sharedstake_referral

# Start services
docker-compose up -d
```

## Integration with Existing Workflows

### Development Workflow
```bash
# Local development
bun run dev

# Test changes
bun run pre-commit

# Deploy to staging
./scripts/deploy.sh services
```

### CI/CD Workflow
```yaml
# .github/workflows/ci.yml automatically:
1. Installs dependencies
2. Runs linter
3. Runs type-check
4. Builds application
5. Runs referral service tests
```

### Deployment Workflow
```bash
# 1. Update code
git pull

# 2. Update environment (if needed)
vim .env.production

# 3. Deploy contracts (if changed)
./scripts/deploy.sh contracts

# 4. Deploy services
docker-compose up -d --build

# 5. Verify deployment
curl http://localhost:3001/health
```

## Maintenance

### Regular Maintenance Tasks
- Weekly: Review logs for errors
- Monthly: Update dependencies
- Quarterly: Review and rotate credentials
- As needed: Update documentation

### Dependency Updates
```bash
# Check for updates
bun update

# Test updates
bun run pre-commit

# Commit if tests pass
git commit package.json bun.lock
```

## Performance Optimization

### Database Optimization
- Use connection pooling
- Index frequently queried columns
- Archive old data
- Regular vacuum and analyze

### Service Optimization
- Use production build
- Enable gzip compression
- Implement caching
- Use CDN for static assets

## Disaster Recovery

### Recovery Scenarios
1. **Service Failure**: Restart service via docker-compose
2. **Database Failure**: Restore from backup
3. **Complete Failure**: Rebuild from scratch using deployment scripts

### Recovery Time Objectives
- Service restart: < 5 minutes
- Database restore: < 30 minutes
- Full rebuild: < 2 hours

## Contact and Support

### Issues and Questions
- Check logs first: `docker-compose logs`
- Review this documentation
- Check GitHub issues
- Contact operations team

### Escalation
- For critical issues: Page on-call engineer
- For security issues: Follow security incident response
- For feature requests: Create GitHub issue