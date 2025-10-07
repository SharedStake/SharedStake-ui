# Advanced Features: MEV-Boost, RPC Endpoints, and Performance Optimization

## Introduction: Beyond Basic Node Operation

Running an Ethereum node is just the beginning. To maximize your node's potential – whether for profit, performance, or providing services – you need to understand and implement advanced features. This guide covers three critical areas that can transform your node from a basic validator to a professional-grade operation:

1. **MEV-Boost Integration**: Maximize your validator rewards
2. **RPC Endpoint Configuration**: Provide blockchain access services
3. **Performance Optimization**: Squeeze every bit of efficiency from your hardware

Let's dive deep into each of these areas and unlock your node's full potential.

## Part 1: Mastering MEV-Boost

### Understanding MEV (Maximal Extractable Value)

MEV represents the additional value that can be extracted from block production beyond standard rewards. This includes:

- **Priority fees** from users wanting faster inclusion
- **Arbitrage profits** from DEX price differences
- **Liquidation bonuses** from lending protocols
- **NFT minting opportunities**
- **Sandwich attack profits** (controversial but real)

Without MEV-Boost, validators only receive:
- Block rewards (currently ~0.05 ETH)
- Priority fees from regular transactions

With MEV-Boost, validators can earn:
- All of the above PLUS
- MEV profits shared by searchers/builders
- Potentially 2-10x higher rewards per block

### How MEV-Boost Works

```
Validator → MEV-Boost → Relays → Builders → Searchers
```

1. **Searchers** find profitable opportunities
2. **Builders** construct optimal blocks
3. **Relays** auction blocks to validators
4. **MEV-Boost** connects your validator to relays
5. **Your validator** proposes the most profitable block

### Installing MEV-Boost with eth2-quickstart

The installation is automated:

```bash
./install_mev_boost.sh
```

This script:
1. Installs Go language support
2. Clones MEV-Boost repository
3. Builds from source (stable branch)
4. Configures systemd service
5. Sets up relay connections

### Configuring MEV Relays

#### Understanding Relay Selection

Not all relays are created equal. Consider these factors:

**1. Censorship Resistance**
- Some relays filter OFAC-sanctioned addresses
- Others provide uncensored blocks
- Your choice impacts Ethereum's neutrality

**2. Performance and Reliability**
- Relay uptime affects your proposal success
- Network latency impacts bid competitiveness
- Geographic distribution matters

**3. Profit Maximization**
- Different relays access different builders
- More relays generally mean higher bids
- But too many can cause timeout issues

#### Configuring Relays in exports.sh

```bash
# Edit your configuration
nano ~/eth2-quickstart/exports.sh

# Flashbots relay (censoring, high performance)
export MEV_RELAYS='https://0xac6e77dfe25ecd6110b8e780608cce0dab71fdd5ebea22a16c0205200f2f8e2e3ad3b71d3499c54ad14d6c21b41a37ae@boost-relay.flashbots.net'

# Add Ultra Sound relay (uncensored)
MEV_RELAYS=$MEV_RELAYS',https://0xa1559ace749633b997cb3fdacffb890aeebdb0f5a3b6aaa7eeeaf1a38af0a8fe88b9e4b1f61f236d2e64d95733327a62@relay.ultrasound.money'

# Add Agnostic relay (uncensored)
MEV_RELAYS=$MEV_RELAYS',https://0xa7ab7a996c8584251c8f925da3170bdfd6ebc75d50f5ddc4050a6fdc77f2a3b5fce2cc750d0865e05d7228af97d69561@agnostic-relay.net'

# Add Eden Network (partial filtering)
MEV_RELAYS=$MEV_RELAYS',https://0xb3ee7afcf27f1f1259ac1787876318c6584ee353097a50ed84f51a1f21a323b3736f271a895c7ce918c038e4265918be@relay.edennetwork.io'
```

#### Relay Performance Comparison

| Relay | Censoring | Avg Bid | Uptime | Latency |
|-------|-----------|---------|---------|---------|
| Flashbots | Yes | High | 99.9% | Low |
| Ultra Sound | No | High | 99.5% | Medium |
| Agnostic | No | Medium | 99% | Low |
| Eden | Partial | Medium | 98% | Medium |
| Blocknative | Yes | High | 99% | Low |

### Advanced MEV Configuration

#### Minimum Bid Settings

Protect against low-value blocks:

```bash
# In exports.sh
export MIN_BID=0.002  # Minimum 0.002 ETH profit to use MEV block

# Conservative (always use MEV blocks)
export MIN_BID=0

# Aggressive (only high-value blocks)
export MIN_BID=0.05
```

#### Timeout Configuration

Balance speed vs reliability:

```bash
# Fast timeouts (may miss some bids)
export MEVGETHEADERT=750    # 750ms for header
export MEVGETPAYLOADT=3000  # 3s for payload
export MEVREGVALT=3000      # 3s for registration

# Conservative timeouts (more reliable)
export MEVGETHEADERT=950    # 950ms for header
export MEVGETPAYLOADT=4000  # 4s for payload
export MEVREGVALT=6000      # 6s for registration
```

### Monitoring MEV Performance

#### Check Registration Status

Verify your validator is registered:

```bash
# Get your validator public key
curl http://localhost:5052/eth/v1/beacon/states/head/validators/YOUR_INDEX

# Check registration (add 0x prefix)
curl https://boost.flashbots.net/relay/v1/data/validator_registration?pubkey=0xYOUR_PUBKEY
```

#### Monitor Relay Performance

Track bid values and success rates:

```bash
# View MEV-Boost logs
sudo journalctl -fu mev

# Look for lines like:
# "best bid" value=0.123
# "relay responded" relay=flashbots
```

#### Calculate MEV Revenue

Track your additional earnings:

```bash
# Check recent blocks on beaconcha.in
# Compare blocks with/without MEV
# Typical MEV block: 0.1-0.5 ETH
# Typical vanilla block: 0.02-0.05 ETH
```

### Troubleshooting MEV-Boost

#### Common Issues and Solutions

**1. No bids received:**
```bash
# Check MEV-Boost is running
sudo systemctl status mev

# Verify relay connectivity
curl https://boost-relay.flashbots.net/eth/v1/builder/status

# Check firewall isn't blocking
sudo ufw status
```

**2. Registration failures:**
```bash
# Ensure fee recipient is set
grep FEE_RECIPIENT ~/eth2-quickstart/exports.sh

# Restart services in correct order
sudo systemctl restart eth1
sudo systemctl restart cl
sudo systemctl restart mev
sudo systemctl restart validator
```

**3. Low bid values:**
- Add more relays
- Check network latency
- Verify you're not in a low-MEV period

## Part 2: Setting Up Professional RPC Endpoints

### Why Run Your Own RPC?

Running your own RPC endpoint provides:

1. **Censorship Resistance**: No filtered transactions
2. **Privacy**: No data collection by third parties
3. **Reliability**: No rate limits or downtime
4. **Performance**: Lower latency for local apps
5. **Cost Savings**: No API fees for high usage

### Architecture Overview

```
Internet → Nginx → Geth RPC
         ↓
      SSL/TLS
         ↓
   Rate Limiting
         ↓
   Authentication
```

### Basic RPC Setup

#### Step 1: Install Nginx

```bash
cd ~/eth2-quickstart
./install_nginx.sh
```

This configures:
- Reverse proxy to Geth
- Basic rate limiting
- Security headers
- WebSocket support

#### Step 2: Configure Domain

```bash
# Edit configuration
nano exports.sh

# Set your domain
export SERVER_NAME="rpc.yourdomain.com"
```

#### Step 3: Set Up SSL

```bash
# Using ACME (recommended)
./install_acme_ssl.sh

# Or using Certbot
./install_ssl_certbot.sh
```

### Advanced Nginx Configuration

#### Custom Rate Limiting

Edit `/etc/nginx/sites-enabled/default`:

```nginx
# Define rate limit zones
limit_req_zone $binary_remote_addr zone=rpc:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=ws:10m rate=5r/s;

server {
    location /rpc {
        limit_req zone=rpc burst=20 nodelay;
        
        proxy_pass http://127.0.0.1:8545;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location /ws {
        limit_req zone=ws burst=10 nodelay;
        
        proxy_pass http://127.0.0.1:8546;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### API Key Authentication

Implement basic authentication:

```bash
# Install apache utilities
sudo apt-get install apache2-utils

# Create password file
sudo htpasswd -c /etc/nginx/.htpasswd user1

# Update Nginx config
location /rpc {
    auth_basic "RPC Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    proxy_pass http://127.0.0.1:8545;
}
```

#### IP Whitelisting

Restrict access to specific IPs:

```nginx
location /rpc {
    allow 192.168.1.0/24;  # Local network
    allow 1.2.3.4;         # Specific IP
    deny all;
    
    proxy_pass http://127.0.0.1:8545;
}
```

### Monitoring RPC Usage

#### Access Logs Analysis

```bash
# View recent requests
tail -f /var/log/nginx/access.log

# Count requests per IP
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# Monitor request methods
grep "eth_call" /var/log/nginx/access.log | wc -l
```

#### Performance Monitoring

```bash
# Install monitoring tools
sudo apt-get install vnstat iftop

# Monitor bandwidth usage
vnstat -l

# Watch real-time connections
sudo iftop
```

### Optimizing RPC Performance

#### Geth RPC Configuration

Optimize Geth for RPC serving:

```bash
# In install_geth.sh or systemd service
--http.api "eth,net,web3,txpool"
--http.corsdomain "*"
--http.vhosts "*"
--rpc.gascap 50000000
--rpc.txfeecap 10
--ws.api "eth,net,web3"
--ws.origins "*"
```

#### Caching Responses

Implement Redis caching:

```bash
# Install Redis
sudo apt-get install redis-server

# Configure Nginx with Redis
location /rpc {
    set $key $request_uri;
    
    # Try cache first
    redis_pass 127.0.0.1:6379;
    redis_key $key;
    
    # Fall back to proxy
    error_page 404 = @proxy;
}

location @proxy {
    proxy_pass http://127.0.0.1:8545;
    
    # Cache successful responses
    proxy_cache_valid 200 1m;
}
```

## Part 3: Performance Optimization

### System-Level Optimizations

#### CPU Governor Settings

Maximize CPU performance:

```bash
# Check current governor
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor

# Set to performance mode
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Make persistent
sudo apt-get install cpufrequtils
echo 'GOVERNOR="performance"' | sudo tee /etc/default/cpufrequtils
```

#### Memory Management

Optimize memory allocation:

```bash
# Increase memory limits
sudo sysctl -w vm.max_map_count=655350

# Reduce swappiness
sudo sysctl -w vm.swappiness=10

# Make persistent
echo "vm.max_map_count=655350" | sudo tee -a /etc/sysctl.conf
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
```

#### Disk I/O Optimization

Improve disk performance:

```bash
# Use noatime mount option
sudo nano /etc/fstab
# Add noatime to mount options:
# UUID=xxx / ext4 defaults,noatime 0 1

# Configure I/O scheduler for NVMe
echo none | sudo tee /sys/block/nvme0n1/queue/scheduler

# For SSD
echo noop | sudo tee /sys/block/sda/queue/scheduler
```

### Network Optimizations

#### TCP Tuning

Optimize network stack:

```bash
# Increase network buffers
sudo sysctl -w net.core.rmem_max=134217728
sudo sysctl -w net.core.wmem_max=134217728
sudo sysctl -w net.ipv4.tcp_rmem="4096 87380 134217728"
sudo sysctl -w net.ipv4.tcp_wmem="4096 65536 134217728"

# Enable TCP fast open
sudo sysctl -w net.ipv4.tcp_fastopen=3

# Increase connection backlog
sudo sysctl -w net.core.somaxconn=1024
```

#### Peer Optimization

Configure optimal peer settings:

```bash
# In exports.sh
# For high-bandwidth servers
export MAX_PEERS=150

# For Geth
--maxpeers 150
--netrestrict "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
```

### Client-Specific Optimizations

#### Geth Performance Tuning

```bash
# Optimal Geth flags
--cache 16384           # 16GB cache
--maxpeers 100         
--syncmode snap        
--txlookuplimit 0      # Disable tx indexing if not needed
--gcmode archive       # If running archive node
```

#### Prysm Optimization

```bash
# Prysm beacon config
--p2p-max-peers 100
--enable-peer-scorer
--block-batch-limit 512
--blob-batch-limit 512
```

#### Database Optimization

Periodic maintenance:

```bash
# Compact Geth database (requires downtime)
sudo systemctl stop eth1
geth --datadir /var/lib/goethereum snapshot prune-state
sudo systemctl start eth1

# Prysm database backup
sudo systemctl stop cl
cp -r ~/prysm/beaconchaindata ~/prysm/beaconchaindata.backup
sudo systemctl start cl
```

### Monitoring and Metrics

#### Setting Up Prometheus

```bash
# Install Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xvf prometheus-2.40.0.linux-amd64.tar.gz
sudo mv prometheus-2.40.0.linux-amd64 /opt/prometheus

# Configure for Ethereum metrics
cat > /opt/prometheus/prometheus.yml <<EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'geth'
    static_configs:
      - targets: ['localhost:6060']
  
  - job_name: 'prysm'
    static_configs:
      - targets: ['localhost:8080']
EOF

# Start Prometheus
/opt/prometheus/prometheus --config.file=/opt/prometheus/prometheus.yml
```

#### Grafana Dashboards

```bash
# Install Grafana
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install grafana

# Start Grafana
sudo systemctl start grafana-server
sudo systemctl enable grafana-server

# Access at http://your-ip:3000
# Import dashboard ID: 13457 (Geth)
# Import dashboard ID: 12124 (Prysm)
```

### Advanced Monitoring Scripts

#### Performance Monitor Script

Create `~/monitor.sh`:

```bash
#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Ethereum Node Performance Monitor ===${NC}"
echo ""

# Check services
echo -e "${YELLOW}Service Status:${NC}"
for service in eth1 cl validator mev; do
    if systemctl is-active --quiet $service; then
        echo -e "$service: ${GREEN}✓ Running${NC}"
    else
        echo -e "$service: ${RED}✗ Stopped${NC}"
    fi
done
echo ""

# Check sync status
echo -e "${YELLOW}Sync Status:${NC}"
SYNC_STATUS=$(curl -s -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}' \
    | jq -r '.result')

if [ "$SYNC_STATUS" == "false" ]; then
    echo -e "Execution: ${GREEN}✓ Synced${NC}"
else
    echo -e "Execution: ${YELLOW}⟳ Syncing${NC}"
fi

# Check peer count
PEER_COUNT=$(curl -s -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
    | jq -r '.result' | xargs printf "%d")

echo -e "Peers: $PEER_COUNT"
echo ""

# System resources
echo -e "${YELLOW}System Resources:${NC}"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%"
echo "RAM: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Disk: $(df -h /var/lib/goethereum | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}')"
echo ""

# Network stats
echo -e "${YELLOW}Network (last hour):${NC}"
vnstat -h 1 | grep -A 2 "^    " | tail -n 1

# Recent errors
echo ""
echo -e "${YELLOW}Recent Errors (last 10 min):${NC}"
sudo journalctl --since "10 minutes ago" -p err --no-pager | tail -5
```

Make it executable:
```bash
chmod +x ~/monitor.sh
```

### Optimization Checklist

#### Daily Checks
- [ ] Monitor disk space
- [ ] Check service status
- [ ] Review error logs
- [ ] Verify peer connections
- [ ] Check sync status

#### Weekly Tasks
- [ ] Review MEV performance
- [ ] Analyze RPC usage
- [ ] Check for client updates
- [ ] Review security logs
- [ ] Test backup procedures

#### Monthly Maintenance
- [ ] Update system packages
- [ ] Rotate logs
- [ ] Review resource usage trends
- [ ] Test disaster recovery
- [ ] Audit security settings

## Scaling Considerations

### Running Multiple Nodes

#### Load Balancing RPC

Use HAProxy for multiple backends:

```bash
# Install HAProxy
sudo apt-get install haproxy

# Configure load balancing
cat > /etc/haproxy/haproxy.cfg <<EOF
global
    maxconn 4096

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

backend eth_nodes
    balance roundrobin
    server node1 127.0.0.1:8545 check
    server node2 127.0.0.1:8546 check
    server node3 192.168.1.100:8545 check

frontend eth_rpc
    bind *:80
    default_backend eth_nodes
EOF
```

#### Redundant Validators

**WARNING**: Never run the same validator keys on multiple machines simultaneously!

For redundancy:
1. Set up multiple beacon nodes
2. Use single validator with fallback beacon endpoints
3. Implement automatic failover with monitoring

### Cost Optimization

#### Resource Sharing

Share resources between services:

```bash
# Use same JWT for multiple consensus clients
cp ~/secrets/jwt.hex ~/lighthouse/jwt.hex
cp ~/secrets/jwt.hex ~/teku/jwt.hex

# Share execution client between validators
# Point multiple consensus clients to same Geth
```

#### Storage Optimization

Reduce storage requirements:

```bash
# Prune Geth state
geth snapshot prune-state

# Use snap sync instead of full
--syncmode snap

# Limit transaction history
--txlookuplimit 1000
```

## Security Considerations

### RPC Security Best Practices

1. **Never expose admin APIs**
   ```bash
   # Bad: --http.api "admin,eth,net,web3"
   # Good: --http.api "eth,net,web3"
   ```

2. **Use JWT for Engine API**
   Always keep jwt.hex secure and unique

3. **Implement rate limiting**
   Prevent DoS attacks on your RPC

4. **Monitor for abuse**
   Watch for unusual patterns in logs

### MEV Security

1. **Verify relay authenticity**
   Only use official relay endpoints

2. **Monitor for failed proposals**
   Could indicate relay issues

3. **Keep MEV-Boost updated**
   Security fixes are important

## Conclusion

Advanced features transform your Ethereum node from a simple validator into a professional operation. Whether you're maximizing profits with MEV-Boost, providing RPC services, or optimizing performance, these enhancements make your contribution to the network more valuable.

Key takeaways:

1. **MEV-Boost is essential** for competitive validator rewards
2. **RPC endpoints** provide sovereignty and can serve your community
3. **Performance optimization** reduces costs and improves reliability
4. **Monitoring is critical** for maintaining a professional operation
5. **Security must be layered** throughout your setup

With these advanced features properly configured, your node is ready for any challenge the Ethereum network can throw at it.

---

*This is part 4 of a 5-part series on eth2-quickstart. Next up: "Troubleshooting, Maintenance, and Long-term Node Management"*