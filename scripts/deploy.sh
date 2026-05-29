#!/bin/bash
# Deploy contracts and services

case "${1:-help}" in
  contracts)
    cd SharedDeposit && npx hardhat deploy --network sepolia --tags all
    ;;
  services)
    docker-compose up -d
    ;;
  backup)
    BACKUP_DIR="${BACKUP_DIR:-./backups}"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    mkdir -p "$BACKUP_DIR/postgres"
    docker-compose exec -T postgres pg_dump -U sharedstake sharedstake_referral | gzip > "$BACKUP_DIR/postgres/db_$TIMESTAMP.sql.gz"
    find "$BACKUP_DIR" -type f -mtime +30 -delete
    echo "Backup completed"
    ;;
  *)
    echo "Usage: $0 [contracts|services|backup]"
    ;;
esac