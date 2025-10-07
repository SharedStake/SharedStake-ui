---
id: "eth2-quickstart-maintenance"
slug: "ethereum-node-troubleshooting-maintenance"
title: "Troubleshooting, Maintenance, and Long-term Node Management"
excerpt: "Complete guide to maintaining your Ethereum node, troubleshooting common issues, and ensuring long-term reliability."
author: "SharedStake Team"
publishDate: "2024-10-11"
tags: ["ethereum", "maintenance", "troubleshooting", "eth2-quickstart", "monitoring", "backup"]
featured: false
meta:
  description: "Comprehensive guide to Ethereum node maintenance, troubleshooting common issues, disaster recovery, and long-term management."
  keywords: "ethereum node maintenance, troubleshooting, disaster recovery, monitoring, backup strategies, node management"
---

# Troubleshooting, Maintenance, and Long-term Node Management

## Introduction: The Reality of Node Operation

Running an Ethereum node isn't a "set it and forget it" operation. Like any critical infrastructure, it requires ongoing attention, regular maintenance, and occasional troubleshooting. This comprehensive guide covers everything you need to know about keeping your node healthy, resolving common issues, and ensuring long-term reliability.

Whether you're dealing with your first sync failure or planning a major client upgrade, this guide will help you navigate the challenges of node operation with confidence.

## Part 1: Common Issues and Solutions

### Sync Problems

#### Issue: Execution Client Won't Sync

**Symptoms:**
- Stuck at a specific block
- "Looking for peers" messages
- Sync percentage not increasing

**Diagnostic Steps:**

```bash
# Check Geth sync status
sudo geth attach http://localhost:8545
> eth.syncing
> net.peerCount

# Check logs for errors
sudo journalctl -u eth1 -n 100 --no-pager | grep -i error

# Verify disk space
df -h /var/lib/goethereum
```

**Solutions:**

1. **Insufficient peers:**
```bash
# Edit exports.sh
export MAX_PEERS=150  # Increase from default

# Restart service
sudo systemctl restart eth1
```

2. **Corrupted database:**
```bash
# Stop service
sudo systemctl stop eth1

# Remove chaindata (will resync)
sudo rm -rf /var/lib/goethereum/geth/chaindata

# Restart
sudo systemctl start eth1
```

3. **Network issues:**
```bash
# Check firewall
sudo ufw status
sudo ufw allow 30303/tcp
sudo ufw allow 30303/udp

# Test connectivity
nc -zv 127.0.0.1 30303
```

#### Issue: Consensus Client Sync Stuck

**Symptoms:**
- Not advancing slots
- "Waiting for genesis" errors
- Checkpoint sync failing

**Solutions:**

1. **Update checkpoint URL:**
```bash
# Edit exports.sh
export PRYSM_CPURL="https://beaconstate.info"
# Alternative: https://checkpoint-sync.ethpandaops.io

# Restart
sudo systemctl restart cl
```

2. **Clear database and resync:**
```bash
# Stop service
sudo systemctl stop cl validator

# Backup (just in case)
cp -r ~/prysm/beaconchaindata ~/prysm/beaconchaindata.backup

# Remove database
rm -rf ~/prysm/beaconchaindata

# Restart with checkpoint sync
sudo systemctl start cl
```

3. **JWT authentication issues:**
```bash
# Regenerate JWT
openssl rand -hex 32 > ~/secrets/jwt.hex

# Ensure both clients use same JWT
sudo systemctl restart eth1 cl
```

### Validator Issues

#### Issue: Validator Not Attesting

**Symptoms:**
- No attestations on beaconcha.in
- "Waiting for beacon node" messages
- Validator balance not increasing

**Diagnostic Commands:**

```bash
# Check validator status
sudo journalctl -fu validator | grep -i "error\|warn"

# Verify validator is imported
cd ~/prysm
./prysm.sh validator accounts list

# Check beacon node connection
curl http://localhost:3500/eth/v1/node/health
```

**Solutions:**

1. **Beacon node not synced:**
```bash
# Wait for sync to complete
sudo journalctl -fu cl | grep "Synced"

# Check sync status via API
curl http://localhost:3500/eth/v1/node/syncing
```

2. **Wrong fee recipient:**
```bash
# Verify configuration
grep FEE_RECIPIENT ~/eth2-quickstart/exports.sh

# Update if needed
nano ~/eth2-quickstart/exports.sh
# Set correct FEE_RECIPIENT

# Regenerate configs
cd ~/eth2-quickstart
./install_prysm.sh

# Restart
sudo systemctl restart validator
```

3. **Time sync issues:**
```bash
# Check system time
timedatectl status

# Force sync
sudo chrony sources -v
sudo chronyc makestep
```

#### Issue: Validator Slashed

**CRITICAL**: If your validator is slashed, immediate action required!

**Symptoms:**
- Large balance reduction (>1 ETH)
- Slashing event on beaconcha.in
- Error messages in logs

**Immediate Actions:**

1. **Stop validator immediately:**
```bash
sudo systemctl stop validator
sudo systemctl disable validator
```

2. **Investigate cause:**
```bash
# Check for duplicate validators
# Did you run keys on multiple machines?

# Review logs before slashing
sudo journalctl -u validator --since "2 hours ago" > slashing_logs.txt
```

3. **Prevent future slashing:**
- Never run same keys on multiple machines
- Use slashing protection database
- Implement proper key management

### MEV-Boost Problems

#### Issue: No MEV Blocks Proposed

**Symptoms:**
- Only vanilla blocks proposed
- No bids received from relays
- Registration failures

**Diagnostic Steps:**

```bash
# Check MEV-Boost status
sudo systemctl status mev
sudo journalctl -fu mev | grep -i "error\|bid"

# Verify registration
curl http://localhost:18550/eth/v1/builder/status

# Test relay connectivity
curl https://boost-relay.flashbots.net/eth/v1/builder/status
```

**Solutions:**

1. **Registration not complete:**
```bash
# Ensure fee recipient is set
grep FEE_RECIPIENT exports.sh

# Restart in correct order
sudo systemctl restart eth1
sleep 10
sudo systemctl restart cl
sleep 10
sudo systemctl restart mev
sleep 10
sudo systemctl restart validator
```

2. **Relay connectivity issues:**
```bash
# Test each relay
for relay in $(grep MEV_RELAYS exports.sh | cut -d'@' -f2); do
    echo "Testing $relay"
    curl -s https://$relay/eth/v1/builder/status
done

# Remove non-responsive relays
nano exports.sh
# Comment out failing relays
```

3. **Timing issues:**
```bash
# Increase timeouts in exports.sh
export MEVGETHEADERT=1200  # Increase from 950
export MEVGETPAYLOADT=5000  # Increase from 4000
export MEVREGVALT=8000      # Increase from 6000

# Restart MEV-Boost
sudo systemctl restart mev
```

### Network and Connectivity Issues

#### Issue: High Bandwidth Usage

**Symptoms:**
- ISP complaints
- Bandwidth caps exceeded
- Slow network performance

**Solutions:**

1. **Reduce peer count:**
```bash
# Edit exports.sh
export MAX_PEERS=50  # Reduce from 100

# Apply to Geth
# Add to systemd service: --maxpeers 50

sudo systemctl daemon-reload
sudo systemctl restart eth1 cl
```

2. **Implement traffic shaping:**
```bash
# Install wondershaper
sudo apt-get install wondershaper

# Limit bandwidth (e.g., 100 Mbps down, 50 Mbps up)
sudo wondershaper eth0 100000 50000

# Make persistent
echo "wondershaper eth0 100000 50000" | sudo tee -a /etc/rc.local
```

3. **Block abusive peers:**
```bash
# Identify high-traffic peers
sudo netstat -tunp | grep :30303 | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn

# Block specific IPs
sudo ufw deny from 1.2.3.4
```

#### Issue: Port Forwarding Not Working

**Symptoms:**
- Low peer count
- "No inbound connections" warnings
- Slow sync

**Testing:**

```bash
# Check if ports are open (from another machine)
nmap -p 30303,13000,12000 YOUR_SERVER_IP

# Or use online tool
# https://www.yougetsignal.com/tools/open-ports/
```

**Solutions:**

1. **Router configuration:**
   - Access router admin panel
   - Forward ports 30303 (TCP/UDP), 13000 (TCP), 12000 (UDP)
   - Use static IP for your node

2. **Firewall check:**
```bash
# Verify UFW rules
sudo ufw status numbered

# Ensure ports are allowed
sudo ufw allow 30303/tcp
sudo ufw allow 30303/udp
sudo ufw allow 13000/tcp
sudo ufw allow 12000/udp
```

## Part 2: Maintenance Procedures

### Regular Maintenance Tasks

#### Daily Tasks

**1. Check Service Status:**

Create a daily check script:

```bash
#!/bin/bash
# Save as ~/daily_check.sh

echo "=== Daily Node Check $(date) ==="

# Check services
for service in eth1 cl validator mev; do
    status=$(systemctl is-active $service)
    if [ "$status" = "active" ]; then
        echo "✓ $service is running"
    else
        echo "✗ $service is $status - NEEDS ATTENTION"
    fi
done

# Check disk space
disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $disk_usage -gt 80 ]; then
    echo "⚠ Disk usage is ${disk_usage}% - CLEANUP NEEDED"
else
    echo "✓ Disk usage is ${disk_usage}%"
fi

# Check sync status
sync_status=$(curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}' | jq -r '.result')
if [ "$sync_status" = "false" ]; then
    echo "✓ Node is synced"
else
    echo "⚠ Node is syncing"
fi

# Check for errors in last hour
error_count=$(sudo journalctl --since "1 hour ago" -p err --no-pager | wc -l)
if [ $error_count -gt 0 ]; then
    echo "⚠ Found $error_count errors in last hour"
else
    echo "✓ No errors in last hour"
fi
```

Make it executable and add to crontab:

```bash
chmod +x ~/daily_check.sh

# Add to crontab
crontab -e
# Add line:
0 9 * * * /home/eth/daily_check.sh >> /home/eth/node_health.log
```

#### Weekly Tasks

**1. Update Check:**

```bash
#!/bin/bash
# Save as ~/weekly_maintenance.sh

echo "=== Weekly Maintenance $(date) ==="

# Check for system updates
sudo apt update
updates=$(apt list --upgradable 2>/dev/null | grep -c "upgradable")
echo "System updates available: $updates"

# Check client versions
echo "Current Geth version:"
geth version | head -1

echo "Latest Geth version:"
curl -s https://api.github.com/repos/ethereum/go-ethereum/releases/latest | jq -r '.tag_name'

# Check disk usage trend
echo "Disk usage growth (last 7 days):"
find /var/lib/goethereum -type f -mtime -7 -exec du -ch {} + | grep total

# Backup critical files
echo "Backing up configuration..."
tar -czf ~/backups/config-$(date +%Y%m%d).tar.gz ~/eth2-quickstart/exports.sh ~/prysm/*.yaml

echo "Weekly maintenance complete"
```

**2. Log Rotation:**

```bash
# Configure logrotate
sudo nano /etc/logrotate.d/ethereum

# Add configuration:
/var/log/ethereum/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    create 644 eth eth
    postrotate
        systemctl reload rsyslog
    endscript
}
```

#### Monthly Tasks

**1. Performance Review:**

```bash
#!/bin/bash
# Save as ~/monthly_review.sh

echo "=== Monthly Performance Review $(date) ==="

# Calculate uptime
echo "Service Uptime:"
for service in eth1 cl validator mev; do
    uptime=$(systemctl show -p ActiveEnterTimestamp $service | cut -d'=' -f2)
    echo "$service: Running since $uptime"
done

# Analyze block proposals
echo "Blocks proposed this month:"
# Query beaconcha.in API or local metrics

# Review disk growth
echo "Disk usage growth:"
du -sh /var/lib/goethereum
du -sh ~/prysm

# Check for missed attestations
echo "Checking validator performance..."
# Query beaconcha.in for effectiveness rating

# Generate report
echo "Generating monthly report..."
sudo journalctl --since "1 month ago" -p err > ~/reports/errors-$(date +%Y%m).log
```

**2. Security Audit:**

```bash
# Check for failed login attempts
echo "Failed SSH attempts:"
sudo grep "Failed password" /var/log/auth.log | wc -l

# Review firewall logs
echo "Blocked connections:"
sudo ufw status verbose

# Check for unusual processes
echo "High CPU processes:"
ps aux | sort -nrk 3,3 | head -5

# Verify file integrity
echo "Checking binary integrity:"
sha256sum /usr/bin/geth
sha256sum ~/prysm/prysm.sh
```

### Client Updates

#### Safe Update Procedure

**1. Preparation:**

```bash
# Backup everything first
sudo systemctl stop validator  # Stop validator first!
sleep 30  # Wait for any pending attestations

# Backup databases
tar -czf ~/backups/geth-backup-$(date +%Y%m%d).tar.gz /var/lib/goethereum
tar -czf ~/backups/prysm-backup-$(date +%Y%m%d).tar.gz ~/prysm

# Note current versions
geth version > ~/versions-before-update.txt
~/prysm/prysm.sh beacon-chain --version >> ~/versions-before-update.txt
```

**2. Update Execution Client:**

```bash
# Update Geth
sudo apt update
sudo apt upgrade geth

# Or for other clients
cd ~/eth2-quickstart
./update.sh  # Uses the update script

# Verify new version
geth version

# Start execution client first
sudo systemctl start eth1

# Wait for sync
sudo journalctl -fu eth1
# Wait for "Block synchronisation started" or similar
```

**3. Update Consensus Client:**

```bash
# Update Prysm
cd ~/prysm
curl https://raw.githubusercontent.com/prysmaticlabs/prysm/master/prysm.sh -o prysm.sh
chmod +x prysm.sh

# Start consensus client
sudo systemctl start cl

# Wait for sync
sudo journalctl -fu cl
# Look for "Synced new block" messages
```

**4. Resume Validation:**

```bash
# Only after both clients are synced
sudo systemctl start validator

# Verify everything is working
sudo journalctl -fu validator
# Look for "Submitted new attestation" messages
```

#### Emergency Rollback Procedure

If update causes issues:

```bash
# Stop everything
sudo systemctl stop validator cl eth1

# Restore from backup
tar -xzf ~/backups/geth-backup-$(date +%Y%m%d).tar.gz -C /
tar -xzf ~/backups/prysm-backup-$(date +%Y%m%d).tar.gz -C ~/

# Downgrade packages if needed
sudo apt install geth=1.10.25  # Specify previous version

# Restart services
sudo systemctl start eth1
sleep 30
sudo systemctl start cl
sleep 30
sudo systemctl start validator
```

### Database Management

#### Pruning Geth Database

```bash
# Schedule during low-activity period
# This requires significant downtime!

# Stop services
sudo systemctl stop validator cl eth1

# Prune state database
geth --datadir /var/lib/goethereum snapshot prune-state

# This can take 2-4 hours and frees 100-200GB

# Restart services
sudo systemctl start eth1 cl validator
```

#### Managing Database Growth

```bash
#!/bin/bash
# Save as ~/db_growth_monitor.sh

GETH_DIR="/var/lib/goethereum"
PRYSM_DIR="$HOME/prysm"

# Get current sizes
geth_size=$(du -sb $GETH_DIR | awk '{print $1}')
prysm_size=$(du -sb $PRYSM_DIR | awk '{print $1}')

# Save to file
echo "$(date +%s),$geth_size,$prysm_size" >> ~/db_growth.csv

# Calculate growth rate (run daily)
if [ -f ~/db_growth.csv ]; then
    yesterday=$(tail -2 ~/db_growth.csv | head -1 | cut -d',' -f2)
    today=$geth_size
    growth=$((($today - $yesterday) / 1024 / 1024))
    echo "Geth DB grew ${growth}MB in last 24h"
fi
```

## Part 3: Disaster Recovery

### Backup Strategies

#### What to Backup

**Critical (MUST backup):**
- Validator keys (`validator_keys/` directory)
- Wallet password
- Configuration files (`exports.sh`)

**Important (SHOULD backup):**
- Slashing protection database
- JWT secret
- Service configurations

**Optional (CAN backup):**
- Chain databases (large, can resync)
- Logs (for analysis)

#### Automated Backup Script

```bash
#!/bin/bash
# Save as ~/backup.sh

BACKUP_DIR="$HOME/backups"
REMOTE_BACKUP="user@backup-server:/backups"
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup critical files
echo "Backing up critical files..."
tar -czf $BACKUP_DIR/critical-$DATE.tar.gz \
    ~/validator_keys \
    ~/eth2-quickstart/exports.sh \
    ~/prysm/direct/accounts \
    ~/secrets/jwt.hex \
    ~/.ssh/authorized_keys

# Backup slashing protection
echo "Backing up slashing protection..."
tar -czf $BACKUP_DIR/slashing-protection-$DATE.tar.gz \
    ~/prysm/direct/validators.db

# Encrypt backups
echo "Encrypting backups..."
gpg --cipher-algo AES256 --symmetric \
    --output $BACKUP_DIR/critical-$DATE.tar.gz.gpg \
    $BACKUP_DIR/critical-$DATE.tar.gz

# Upload to remote location
echo "Uploading to remote backup..."
rsync -avz $BACKUP_DIR/*.gpg $REMOTE_BACKUP/

# Clean old local backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup complete!"
```

### Recovery Procedures

#### Full Node Recovery

Starting from scratch on new hardware:

```bash
# 1. Install OS and basic setup
# Fresh Ubuntu installation
# SSH key setup

# 2. Clone eth2-quickstart
git clone https://github.com/chimera-defi/eth2-quickstart
cd eth2-quickstart

# 3. Restore configuration
# Copy your backed-up exports.sh
scp user@backup-server:/backups/exports.sh ./

# 4. Run setup scripts
./run_1.sh
# Reboot
# Login as eth user

# 5. Restore validator keys
cd ~
tar -xzf critical-backup.tar.gz.gpg
gpg --decrypt critical-backup.tar.gz.gpg | tar -xz

# 6. Install clients
cd ~/eth2-quickstart
./run_2.sh

# 7. Import validator keys
cd ~/prysm
./prysm.sh validator accounts import --keys-dir=~/validator_keys

# 8. Restore slashing protection
cp ~/backup/validators.db ~/prysm/direct/

# 9. Start services
sudo systemctl start eth1 cl mev
# Wait for sync
sudo systemctl start validator
```

#### Partial Recovery Scenarios

**Scenario 1: Corrupted Execution Database**

```bash
# Stop services
sudo systemctl stop validator cl eth1

# Remove corrupted database
sudo rm -rf /var/lib/goethereum/geth/chaindata

# Restart and resync
sudo systemctl start eth1
# Wait for sync (12-48 hours)
sudo systemctl start cl validator
```

**Scenario 2: Lost Validator Keys**

**CRITICAL**: Without backup, keys are unrecoverable!

If you have mnemonic:
```bash
# Use official launchpad to regenerate
# https://launchpad.ethereum.org
# Or use ethdo tool
ethdo account create --account="Validators/1" --mnemonic="your mnemonic here"
```

**Scenario 3: Server Compromise**

```bash
# Immediate actions:
# 1. Stop validator to prevent slashing
sudo systemctl stop validator

# 2. Revoke server access
# Change all passwords
# Rotate SSH keys

# 3. Audit for damage
# Check for unauthorized transactions
# Review logs for intrusion timeline

# 4. Rebuild on new server
# Use backup to restore
# Generate new JWT secret
# Consider new validator keys if compromised
```

## Part 4: Advanced Troubleshooting

### Performance Diagnostics

#### CPU Bottlenecks

```bash
# Identify CPU-heavy processes
htop  # Interactive view
top -b -n 1 | head -20  # Snapshot

# Check CPU frequency scaling
cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_cur_freq

# Monitor CPU temperature
sensors  # Install with: sudo apt install lm-sensors

# Trace system calls (advanced)
sudo strace -c -p $(pgrep geth) -f
```

#### Memory Issues

```bash
# Detailed memory usage
free -h
cat /proc/meminfo

# Per-process memory
ps aux | awk '{print $6/1024 " MB\t" $11}' | sort -rn | head -20

# Check for memory leaks
sudo pmap $(pgrep geth) | tail -1

# Monitor swap usage
vmstat 1 10  # Every 1 second, 10 times

# Clear cache if needed (careful!)
sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
```

#### Disk I/O Analysis

```bash
# Real-time I/O stats
iotop  # Install with: sudo apt install iotop

# Detailed disk stats
iostat -x 1  # Install with: sudo apt install sysstat

# Find large files
du -h /var/lib/goethereum | sort -rh | head -20

# Check disk health
sudo smartctl -a /dev/nvme0n1  # Install with: sudo apt install smartmontools

# Analyze I/O patterns
sudo iosnoop  # BPF tool for I/O tracing
```

### Network Diagnostics

#### Peer Connectivity Issues

```bash
# List all connections
sudo netstat -tunap | grep -E "30303|13000|12000"

# Monitor connection attempts
sudo tcpdump -i any port 30303 -nn

# Check DNS resolution
nslookup bootnodes.ethereum.org

# Test specific peer
ping -c 4 enode://...@1.2.3.4:30303

# Analyze network latency
mtr --report --report-cycles 100 8.8.8.8
```

#### Bandwidth Analysis

```bash
# Real-time bandwidth monitor
sudo iftop -i eth0

# Historical bandwidth usage
vnstat -d  # Daily
vnstat -m  # Monthly

# Per-process bandwidth
sudo nethogs

# Packet loss detection
ping -c 100 -i 0.2 8.8.8.8 | grep loss
```

### Log Analysis

#### Efficient Log Searching

```bash
# Search across all services
sudo journalctl -u eth1 -u cl -u validator -u mev --since "1 hour ago" | grep -i error

# Find patterns in logs
sudo journalctl -u eth1 --since today | awk '/pattern/ {count++} END {print count}'

# Export logs for analysis
sudo journalctl -u cl --since "2023-01-01" --until "2023-01-31" > january_logs.txt

# Analyze log frequency
sudo journalctl -u eth1 -p err --since "7 days ago" | cut -d' ' -f1-3 | uniq -c | sort -rn
```

#### Common Log Patterns

**Healthy execution client:**
```
INFO [01-15|12:34:56.789] Imported new chain segment
INFO [01-15|12:34:57.123] Syncing beacon headers
```

**Healthy consensus client:**
```
time="2024-01-15 12:34:56" level=info msg="Synced new block"
time="2024-01-15 12:34:57" level=info msg="Submitted new attestation"
```

**Warning signs:**
```
WARN [timestamp] Synchronisation failed, dropping peer
ERROR [timestamp] Failed to write block to chain
level=error msg="Could not request block from peer"
```

## Part 5: Monitoring and Alerting

### Setting Up Comprehensive Monitoring

#### Prometheus + Grafana Stack

```bash
# Complete setup script
#!/bin/bash

# Install Prometheus
wget https://github.com/prometheus/prometheus/releases/latest/download/prometheus-*.linux-amd64.tar.gz
tar xvf prometheus-*.tar.gz
sudo mv prometheus-*/prometheus /usr/local/bin/
sudo mv prometheus-*/promtool /usr/local/bin/

# Configure Prometheus
sudo mkdir -p /etc/prometheus /var/lib/prometheus
cat > /etc/prometheus/prometheus.yml <<EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'geth'
    static_configs:
      - targets: ['localhost:6060']
    metrics_path: /debug/metrics/prometheus

  - job_name: 'prysm_beacon'
    static_configs:
      - targets: ['localhost:8080']

  - job_name: 'prysm_validator'
    static_configs:
      - targets: ['localhost:8081']

  - job_name: 'node_exporter'
    static_configs:
      - targets: ['localhost:9100']
EOF

# Create systemd service
sudo useradd --no-create-home --shell /bin/false prometheus
sudo chown -R prometheus:prometheus /etc/prometheus /var/lib/prometheus

cat > /etc/systemd/system/prometheus.service <<EOF
[Unit]
Description=Prometheus
After=network.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \
    --config.file /etc/prometheus/prometheus.yml \
    --storage.tsdb.path /var/lib/prometheus/ \
    --web.console.templates=/etc/prometheus/consoles \
    --web.console.libraries=/etc/prometheus/console_libraries

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start prometheus
sudo systemctl enable prometheus

# Install Grafana
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install grafana

sudo systemctl start grafana-server
sudo systemctl enable grafana-server

echo "Prometheus running on http://localhost:9090"
echo "Grafana running on http://localhost:3000"
echo "Default Grafana login: admin/admin"
```

### Alert Configuration

#### Critical Alerts

```yaml
# Save as /etc/prometheus/alerts.yml
groups:
  - name: ethereum_alerts
    interval: 30s
    rules:
      - alert: NodeDown
        expr: up == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Node {{ $labels.job }} is down"

      - alert: LowPeerCount
        expr: net_peers < 10
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Low peer count: {{ $value }}"

      - alert: DiskSpaceLow
        expr: node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} < 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Less than 10% disk space remaining"

      - alert: ValidatorOffline
        expr: validator_statuses{status="ACTIVE"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Validator is offline"

      - alert: MissedAttestations
        expr: rate(validator_attestations_missed_total[5m]) > 0.1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Missing attestations: {{ $value }}"
```

#### Notification Setup

**Email Alerts:**

```bash
# Install mail utilities
sudo apt-get install mailutils

# Configure alerts script
cat > ~/send_alert.sh <<'EOF'
#!/bin/bash
SUBJECT="Ethereum Node Alert"
TO="your-email@example.com"
MESSAGE="$1"

echo "$MESSAGE" | mail -s "$SUBJECT" "$TO"
EOF

chmod +x ~/send_alert.sh
```

**Telegram Alerts:**

```bash
# Create Telegram bot and get token
# Talk to @BotFather on Telegram

cat > ~/telegram_alert.sh <<'EOF'
#!/bin/bash
BOT_TOKEN="YOUR_BOT_TOKEN"
CHAT_ID="YOUR_CHAT_ID"
MESSAGE="$1"

curl -s -X POST https://api.telegram.org/bot$BOT_TOKEN/sendMessage \
    -d chat_id=$CHAT_ID \
    -d text="$MESSAGE"
EOF

chmod +x ~/telegram_alert.sh
```

### Health Check Automation

```bash
#!/bin/bash
# Save as ~/health_monitor.sh
# Run via cron every 5 minutes

# Configuration
ALERT_EMAIL="your-email@example.com"
TELEGRAM_SCRIPT="$HOME/telegram_alert.sh"

# Check functions
check_service() {
    local service=$1
    if ! systemctl is-active --quiet $service; then
        alert "CRITICAL: $service is not running"
        return 1
    fi
    return 0
}

check_sync() {
    local sync_status=$(curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}' | jq -r '.result')
    
    if [ "$sync_status" != "false" ]; then
        alert "WARNING: Node is not fully synced"
        return 1
    fi
    return 0
}

check_disk() {
    local usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $usage -gt 90 ]; then
        alert "CRITICAL: Disk usage is ${usage}%"
        return 1
    fi
    return 0
}

check_peers() {
    local peers=$(curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
        | jq -r '.result' | xargs printf "%d")
    
    if [ $peers -lt 10 ]; then
        alert "WARNING: Only $peers peers connected"
        return 1
    fi
    return 0
}

alert() {
    local message=$1
    echo "$(date): $message" >> $HOME/alerts.log
    
    # Send Telegram alert
    if [ -x "$TELEGRAM_SCRIPT" ]; then
        $TELEGRAM_SCRIPT "🚨 $message"
    fi
    
    # Send email alert
    echo "$message" | mail -s "Node Alert" $ALERT_EMAIL
}

# Run checks
check_service eth1
check_service cl
check_service validator
check_service mev
check_sync
check_disk
check_peers

# Log successful check
echo "$(date): Health check completed" >> $HOME/health.log
```

## Best Practices Summary

### Do's

1. **Regular Monitoring**
   - Check node daily
   - Review logs weekly
   - Audit security monthly

2. **Proactive Maintenance**
   - Update clients promptly
   - Prune databases regularly
   - Monitor disk space trends

3. **Robust Backups**
   - Backup validator keys in multiple locations
   - Test recovery procedures
   - Encrypt sensitive backups

4. **Security First**
   - Keep systems updated
   - Use strong passwords
   - Monitor for intrusions

5. **Community Engagement**
   - Join Discord/Telegram groups
   - Follow client teams on Twitter
   - Participate in testnet upgrades

### Don'ts

1. **Never**
   - Run validator keys on multiple machines
   - Ignore security updates
   - Skip backups

2. **Avoid**
   - Making changes during block proposals
   - Updating all clients simultaneously
   - Ignoring warning signs in logs

3. **Don't Forget**
   - Time synchronization is critical
   - Slashing protection database
   - Testing after updates

## Conclusion

Operating an Ethereum node is a responsibility that extends beyond initial setup. With proper maintenance, monitoring, and troubleshooting skills, you can ensure your node remains a reliable part of the Ethereum network for years to come.

Remember:
- **Prevention is better than cure**: Regular maintenance prevents most issues
- **Monitoring saves money**: Early detection prevents slashing and downtime
- **Backups are insurance**: Hope for the best, prepare for the worst
- **Community helps**: Don't hesitate to ask for help when needed
- **Learning never stops**: Each issue is an opportunity to improve

Your node is more than just software – it's your contribution to the decentralized future of finance. Treat it with the care it deserves, and it will reward you with reliable operation and peace of mind.

Thank you for running an Ethereum node and contributing to the network's decentralization and security. Together, we're building the financial infrastructure of tomorrow.

---

*This concludes our 5-part series on eth2-quickstart. For the latest updates and community support, visit [https://github.com/chimera-defi/eth2-quickstart](https://github.com/chimera-defi/eth2-quickstart)*

## Quick Reference

### Emergency Contacts
- Prysm Discord: [discord.gg/prysmaticlabs](https://discord.gg/prysmaticlabs)
- Geth Discord: [discord.gg/ethereum](https://discord.gg/nthXNEv)
- r/ethstaker: [reddit.com/r/ethstaker](https://reddit.com/r/ethstaker)
- EthStaker Discord: [discord.gg/ethstaker](https://discord.gg/ethstaker)

### Essential Commands
```bash
# Service management
sudo systemctl [start|stop|restart|status] [eth1|cl|validator|mev]

# View logs
sudo journalctl -fu [service_name]

# Check sync
curl http://localhost:8545 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}'

# Peer count
curl http://localhost:8545 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'
```

Stay safe, stay synced, and keep staking! 🚀