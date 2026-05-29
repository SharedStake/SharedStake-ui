# Operational Runbook

## Quick Reference

| Command | Purpose |
|---------|---------|
| `./scripts/deploy.sh contracts` | Deploy smart contracts |
| `./scripts/deploy.sh services` | Deploy Docker services |
| `./scripts/deploy.sh backup` | Backup database |
| `docker-compose logs -f referral-service` | View service logs |
| `docker-compose restart referral-service` | Restart service |
| `curl http://localhost:3001/health` | Health check |

## Common Procedures

### 1. Deploy Smart Contracts

**When**: After contract changes or initial deployment

**Steps**:
```bash
# 1. Ensure environment is configured
cat .env.production

# 2. Deploy to testnet first
./scripts/deploy.sh contracts

# 3. Verify deployment
# Check contract addresses in deployment output

# 4. Update environment with new addresses
vim .env.production

# 5. Deploy to mainnet (after testnet verification)
cd SharedDeposit
npx hardhat deploy --network mainnet --tags all
```

**Verification**:
- Check contract addresses are correct
- Verify contract functions work via Etherscan
- Test contract interactions locally

### 2. Deploy Services

**When**: Initial setup, code changes, or service updates

**Steps**:
```bash
# 1. Build and start services
./scripts/deploy.sh services

# 2. Verify services are running
docker-compose ps

# 3. Check health endpoint
curl http://localhost:3001/health

# 4. View logs for errors
docker-compose logs referral-service
```

**Troubleshooting**:
- If service won't start: Check logs, verify database is running
- If health check fails: Check environment variables, database connection
- If database issues: See "Database Issues" section

### 3. Perform Backup

**When**: Daily (automated), before deployments, or manually as needed

**Steps**:
```bash
# Manual backup
./scripts/deploy.sh backup

# Verify backup exists
ls -lh ./backups/postgres/
```

**Automated Backup Setup**:
```bash
# Add to crontab for daily backups at 2 AM
0 2 * * * cd /path/to/SharedStake-ui && ./scripts/deploy.sh backup
```

### 4. Restore Database

**When**: Database corruption, data loss, or migration rollback

**Steps**:
```bash
# 1. Stop services
docker-compose down

# 2. Identify backup to restore
ls -lh ./backups/postgres/

# 3. Restore database
gunzip < ./backups/postgres/db_YYYYMMDD_HHMMSS.sql.gz | \
  docker-compose exec -T postgres psql -U sharedstake -d sharedstake_referral

# 4. Start services
docker-compose up -d

# 5. Verify restoration
curl http://localhost:3001/health
```

**Warning**: This will overwrite current database data. Ensure you have a backup of current state before restoring.

### 5. Update Application

**When**: Code changes, dependency updates, or feature releases

**Steps**:
```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
bun install

# 3. Run tests
bun run pre-commit

# 4. Backup database
./scripts/deploy.sh backup

# 5. Deploy services
docker-compose up -d --build

# 6. Verify deployment
curl http://localhost:3001/health

# 7. Monitor logs
docker-compose logs -f referral-service
```

**Rollback**:
```bash
# If issues occur:
git revert HEAD
docker-compose up -d --build
```

### 6. Troubleshoot Service Issues

**Symptom**: Service not responding

**Steps**:
```bash
# 1. Check if service is running
docker-compose ps

# 2. Check service logs
docker-compose logs referral-service

# 3. Check health endpoint
curl http://localhost:3001/health

# 4. Restart service
docker-compose restart referral-service

# 5. If still failing, check database
docker-compose exec postgres pg_isready -U sharedstake
```

**Common Issues**:
- **Database connection failed**: Check DATABASE_URL, verify postgres is running
- **Port already in use**: Check if port 3001 is used by another process
- **Out of memory**: Check system resources, increase Docker memory limits

### 7. Troubleshoot Database Issues

**Symptom**: Database errors or connection failures

**Steps**:
```bash
# 1. Check database is running
docker-compose ps postgres

# 2. Check database logs
docker-compose logs postgres

# 3. Test database connection
docker-compose exec postgres pg_isready -U sharedstake

# 4. Connect to database
docker-compose exec postgres psql -U sharedstake -d sharedstake_referral

# 5. Check database size
docker-compose exec postgres psql -U sharedstake -d sharedstake_referral -c "\l+"

# 6. Check active connections
docker-compose exec postgres psql -U sharedstake -d sharedstake_referral -c "SELECT count(*) FROM pg_stat_activity;"
```

**Common Issues**:
- **Connection refused**: Check postgres is running, verify credentials
- **Disk full**: Check disk space, clean old backups
- **Slow queries**: Check for long-running queries, add indexes

### 8. Monitor System Health

**Steps**:
```bash
# Check service health
curl http://localhost:3001/health

# Check disk space
df -h

# Check Docker resource usage
docker stats

# Check recent logs
docker-compose logs --tail=100 referral-service

# Check database connections
docker-compose exec postgres psql -U sharedstake -d sharedstake_referral -c "SELECT count(*) FROM pg_stat_activity;"
```

**Alerts to Monitor**:
- Service health check failures
- High error rates in logs
- Disk space > 80%
- Database connection pool exhaustion
- High memory/CPU usage

### 9. Update Dependencies

**When**: Security updates, new features, or dependency deprecations

**Steps**:
```bash
# 1. Check for updates
bun outdated

# 2. Update dependencies
bun update

# 3. Test changes
bun run pre-commit

# 4. Run referral service tests
cd services/referral-service && bun test

# 5. If tests pass, commit changes
git commit package.json bun.lock

# 6. Deploy updated services
docker-compose up -d --build
```

**Caution**: Always test dependency updates in staging before production.

### 10. Handle Security Incident

**When**: Suspicious activity, unauthorized access, or vulnerability discovered

**Steps**:
```bash
# 1. Immediate containment
docker-compose down

# 2. Preserve evidence
docker-compose logs > incident_logs.txt
cp .env.production .env.production.backup

# 3. Rotate credentials
# Change DATABASE_URL, POSTGRES_PASSWORD, API keys

# 4. Update dependencies
bun update
bun audit

# 5. Scan for vulnerabilities
npm audit
# or
bun pm bun audit

# 6. Review access logs
# Check authentication logs, database access logs

# 7. Restore from clean backup if needed
# (see "Restore Database" procedure)

# 8. Restart services with updated credentials
docker-compose up -d

# 9. Monitor for suspicious activity
docker-compose logs -f referral-service
```

**Post-Incident**:
- Document incident timeline
- Update security procedures
- Implement additional monitoring
- Review access controls

## Emergency Procedures

### Service Outage

**Severity**: High

**Response Time**: < 15 minutes

**Steps**:
1. Check service status: `docker-compose ps`
2. Check logs: `docker-compose logs referral-service`
3. Restart service: `docker-compose restart referral-service`
4. If restart fails, check database: `docker-compose logs postgres`
5. If database issue, see "Database Issues" procedure
6. If still failing, restore from backup

### Database Failure

**Severity**: Critical

**Response Time**: < 30 minutes

**Steps**:
1. Check database status: `docker-compose ps postgres`
2. Check database logs: `docker-compose logs postgres`
3. Attempt restart: `docker-compose restart postgres`
4. If restart fails, restore from backup (see "Restore Database")
5. If restore fails, rebuild database from scratch

### Security Breach

**Severity**: Critical

**Response Time**: Immediate

**Steps**:
1. Stop all services: `docker-compose down`
2. Preserve evidence
3. Rotate all credentials
4. Update dependencies
5. Scan for vulnerabilities
6. Restore from clean backup
7. Restart with new credentials
8. Monitor closely

## Maintenance Schedule

### Daily
- [ ] Check service health: `curl http://localhost:3001/health`
- [ ] Review error logs: `docker-compose logs --tail=50 referral-service`
- [ ] Verify backup completed: `ls -lh ./backups/postgres/`

### Weekly
- [ ] Review all logs for patterns
- [ ] Check disk space: `df -h`
- [ ] Verify automated backups are running
- [ ] Review system resources: `docker stats`

### Monthly
- [ ] Update dependencies: `bun update`
- [ ] Review and rotate credentials
- [ ] Clean old backups: `find ./backups -mtime +30 -delete`
- [ ] Review security advisories
- [ ] Update documentation if needed

### Quarterly
- [ ] Full security audit
- [ ] Disaster recovery drill
- [ ] Performance review
- [ ] Capacity planning
- [ ] Documentation review

## Escalation Matrix

| Issue Type | Primary Contact | Escalation | Response Time |
|------------|----------------|------------|---------------|
| Service outage | DevOps Team | Engineering Lead | < 15 min |
| Database failure | DBA Team | CTO | < 30 min |
| Security breach | Security Team | CEO | Immediate |
| Performance issue | DevOps Team | Engineering Lead | < 1 hour |
| Feature request | Product Team | CTO | SLA dependent |

## Contact Information

- **DevOps Team**: devops@sharedstake.org
- **Security Team**: security@sharedstake.org
- **On-call Engineer**: oncall@sharedstake.org
- **Emergency**: emergency@sharedstake.org

## Additional Resources

- [Infrastructure Documentation](INFRASTRUCTURE.md)
- [Deployment Guide](README.md)
- [SharedDeposit Documentation](SharedDeposit/README.md)
- [Referral Service Documentation](services/referral-service/README.md)