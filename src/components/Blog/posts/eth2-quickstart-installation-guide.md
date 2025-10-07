---
id: "eth2-quickstart-installation-guide"
slug: "ethereum-node-step-by-step-installation"
title: "Step-by-Step Installation Guide: From Zero to Ethereum Node"
excerpt: "A comprehensive walkthrough of setting up your Ethereum node using eth2-quickstart, from initial server configuration to running validator."
author: "SharedStake Team"
publishDate: "2024-10-08"
tags: ["ethereum", "node", "installation", "tutorial", "eth2-quickstart", "validator"]
featured: true
meta:
  description: "Complete step-by-step guide to installing an Ethereum node using eth2-quickstart, from server setup to running validator."
  keywords: "ethereum node installation, eth2-quickstart guide, node setup tutorial, validator setup, MEV-boost configuration"
---

# Step-by-Step Installation Guide: From Zero to Ethereum Node

## Introduction

Welcome to the practical guide for setting up your Ethereum node using eth2-quickstart. This comprehensive walkthrough will take you from a fresh server to a fully operational Ethereum node, complete with execution client, consensus client, validator, and MEV-Boost integration.

By the end of this guide, you'll have:
- A security-hardened Ubuntu server
- A fully synchronized Ethereum node
- Professional-grade service management
- Optional RPC endpoints for your applications
- The knowledge to maintain and monitor your node

Let's begin this journey to blockchain independence.

## Prerequisites and Preparation

### Choosing Your Infrastructure

#### Option 1: Bare Metal Server (Recommended)
Bare metal servers offer the best performance and reliability for Ethereum nodes. Popular providers include:
- Hetzner (excellent price/performance ratio)
- OVH (good European option)
- Latitude.sh (crypto-friendly hosting)

**Advantages:**
- Full disk I/O performance
- No virtualization overhead
- Better long-term cost efficiency
- Complete hardware control

#### Option 2: Cloud VPS
While cloud providers can work, be aware of limitations:
- Higher long-term costs
- Potential I/O throttling
- May struggle with initial sync
- Watch for bandwidth charges

**If using cloud, consider:**
- AWS i3 instances (NVMe storage)
- Google Cloud N2 with SSD
- Azure Lsv2 series

### Server Specifications Checklist

```
✓ CPU: 4-8+ cores (AMD Ryzen or Intel Xeon preferred)
✓ RAM: 16-64GB (32GB recommended)
✓ Storage: 2-4TB NVMe SSD (avoid HDDs!)
✓ Network: 1Gbps+ connection, unlimited bandwidth
✓ OS: Ubuntu 20.04 LTS or 22.04 LTS
✓ Access: SSH key authentication configured
```

### Initial Server Setup

1. **Order your server** with Ubuntu 20.04+ pre-installed
2. **Configure RAID** (if applicable):
   - RAID 0 for maximum performance (no redundancy)
   - RAID 1 for redundancy (half capacity)
3. **Set up SSH key authentication** during provisioning
4. **Note your server's IP address**

## Phase 1: Initial System Setup and Hardening

### Step 1: Connect and Clone the Repository

First, SSH into your new server as root:

```bash
ssh root@YOUR_SERVER_IP
```

Clone the eth2-quickstart repository:

```bash
cd /root
git clone https://github.com/chimera-defi/eth2-quickstart
cd eth2-quickstart
chmod +x *.sh
chmod +x lib/*.sh
```

### Step 2: Configure Initial Settings

Before running any scripts, review and modify the configuration file:

```bash
nano exports.sh
```

Key settings to update:

```bash
# Your contact email (important for SSL certificates)
export EMAIL="your-email@example.com"

# Non-root username (keep as 'eth' or customize)
export LOGIN_UNAME='eth'

# SSH port (change from 22 for extra security)
export YourSSHPortNumber='22'

# Your domain name (if setting up RPC endpoints)
export SERVER_NAME="your-domain.com"

# Validator settings (CRITICAL - use your own address!)
export FEE_RECIPIENT=0xYOUR_FEE_RECIPIENT_ADDRESS
export GRAFITTI="YourValidatorName"

# Performance tuning
export GETH_CACHE=8192  # Adjust based on RAM (8GB for 32GB RAM)
export MAX_PEERS=100    # Reduce if bandwidth limited
```

**⚠️ CRITICAL**: Always set your own `FEE_RECIPIENT` address. This is where your validator rewards and MEV income will be sent!

### Step 3: Run System Hardening Script

Execute the first setup script:

```bash
./run_1.sh
```

This script performs critical security hardening:

#### What happens during run_1.sh:

1. **System Updates**
   - Updates all packages to latest versions
   - Removes unnecessary packages
   - Configures automatic security updates

2. **SSH Hardening**
   - Disables password authentication
   - Configures key-only access
   - Sets up rate limiting
   - Changes default settings for security

3. **Firewall Configuration**
   - Sets up UFW (Uncomplicated Firewall)
   - Opens only necessary ports:
     - SSH (22 or custom)
     - Ethereum P2P (30303, 13000, 12000)
     - HTTPS (443) if using RPC
   - Blocks internal service ports from external access

4. **User Account Creation**
   - Creates non-root user (default: 'eth')
   - Sets up sudo privileges
   - Copies SSH keys for the new user

5. **Fail2ban Installation**
   - Protects against brute force attacks
   - Monitors logs for suspicious activity
   - Automatically bans malicious IPs

6. **Time Synchronization**
   - Installs and configures Chrony
   - Ensures accurate system time (critical for consensus)

#### Manual Steps During Installation

The script will pause for important manual steps:

1. **When prompted to review configurations:**
   - Check the network settings displayed
   - Verify firewall rules look correct
   - Ensure SSH is properly configured

2. **Setting up sudo privileges:**
   Open a **new terminal** and run:
   ```bash
   ssh root@YOUR_SERVER_IP
   visudo
   ```
   
   Add this line at the bottom:
   ```
   eth ALL=(ALL) NOPASSWD: ALL
   ```
   Save and exit (Ctrl+X, Y, Enter)

3. **Set password for new user:**
   Back in the original terminal:
   ```bash
   passwd eth
   ```
   Choose a strong password (you'll rarely use it with SSH keys)

### Step 4: Reboot and Reconnect

After the script completes:

```bash
sudo reboot
```

Wait 2-3 minutes, then reconnect as the new user:

```bash
ssh eth@YOUR_SERVER_IP
```

If you changed the SSH port:
```bash
ssh -p YOUR_PORT eth@YOUR_SERVER_IP
```

**Troubleshooting connection issues:**
- If you can't connect, you may need to update your SSH known_hosts:
  ```bash
  nano ~/.ssh/known_hosts
  # Remove the line with your server's IP
  ```
- Ensure your SSH key is properly configured for the new user

## Phase 2: Ethereum Client Installation

### Step 5: Navigate to Installation Directory

After logging in as the 'eth' user:

```bash
cd ~/eth2-quickstart
```

### Step 6: Final Configuration Check

Review your settings one more time:

```bash
nano exports.sh
```

Ensure these critical settings are correct:
- `FEE_RECIPIENT` - Your Ethereum address for rewards
- `GRAFITTI` - Your validator identifier
- `MEV_RELAYS` - Leave default or customize MEV relay selection

### Step 7: Choose Your Clients

You have two options for client installation:

#### Option A: Interactive Client Selection (Recommended for First-Time Users)

Run the client selection assistant:

```bash
./select_clients.sh
```

This interactive tool will:
1. Ask about your use case (solo staking, RPC provider, etc.)
2. Inquire about your hardware resources
3. Recommend optimal client combinations
4. Show you which install scripts to run

#### Option B: Quick Installation with Defaults

For a quick setup with the most popular clients (Geth + Prysm):

```bash
./run_2.sh
```

This installs:
- **Geth** (execution client)
- **Prysm** (consensus client)
- **MEV-Boost** (MEV relay middleware)

### Step 8: Understanding the Installation Process

#### What happens during client installation:

**Geth Installation (`install_geth.sh`):**
1. Adds Ethereum PPA repository
2. Installs latest Geth version
3. Creates systemd service configuration
4. Sets up JWT authentication
5. Configures sync mode and cache settings
6. Enables JSON-RPC and WebSocket endpoints

**Prysm Installation (`install_prysm.sh`):**
1. Downloads Prysm management script
2. Generates JWT secret for Engine API
3. Creates configuration files:
   - `prysm_beacon_conf.yaml` - Beacon chain settings
   - `prysm_validator_conf.yaml` - Validator settings
4. Sets up systemd services for beacon and validator
5. Configures checkpoint sync for faster synchronization

**MEV-Boost Installation (`install_mev_boost.sh`):**
1. Installs Go programming language
2. Clones and builds MEV-Boost from source
3. Configures relay endpoints
4. Creates systemd service
5. Sets up minimum bid and timeout parameters

### Step 9: Start Your Services

After installation completes, start the services:

```bash
# Start execution client
sudo systemctl start eth1
sudo systemctl enable eth1

# Start consensus client (beacon chain)
sudo systemctl start cl
sudo systemctl enable cl

# Start MEV-Boost
sudo systemctl start mev
sudo systemctl enable mev

# Start validator (only if you have validator keys set up)
# sudo systemctl start validator
# sudo systemctl enable validator
```

### Step 10: Verify Services Are Running

Check the status of each service:

```bash
# Check execution client
sudo systemctl status eth1

# Check consensus client
sudo systemctl status cl

# Check MEV-Boost
sudo systemctl status mev
```

You should see "active (running)" in green for each service.

### Step 11: Monitor Initial Synchronization

Your node will now begin synchronizing with the Ethereum network. This process varies by client and network conditions:

#### Monitoring Execution Client (Geth):

```bash
# View Geth logs
sudo journalctl -fu eth1

# Check sync status (in another terminal)
sudo geth attach http://localhost:8545
> eth.syncing
```

When fully synced, `eth.syncing` returns `false`.

#### Monitoring Consensus Client (Prysm):

```bash
# View beacon chain logs
sudo journalctl -fu cl

# Look for messages like:
# "Synced new block" - actively syncing
# "Synced to slot" - following chain head
```

#### Sync Time Estimates:

- **With checkpoint sync**: 10-30 minutes for consensus, 12-48 hours for execution
- **Without checkpoint sync**: 2-5 days for full sync
- **Factors affecting sync speed**: Peer quality, disk I/O, network bandwidth

## Phase 3: Validator Setup (For Stakers)

**⚠️ IMPORTANT**: Only proceed if you plan to stake 32 ETH per validator.

### Step 12: Generate or Import Validator Keys

#### Option A: Generate New Keys

Use the official Ethereum launchpad:
1. Visit https://launchpad.ethereum.org
2. Follow the key generation process
3. Save your mnemonic phrase securely (CRITICAL!)
4. Transfer the generated `validator_keys` folder to your server

#### Option B: Import Existing Keys

If you have existing validator keys:

```bash
cd ~/prysm
./prysm.sh validator accounts import --keys-dir=/path/to/validator_keys
```

You'll be prompted to:
1. Enter the password used when creating keys
2. Create a wallet password for Prysm
3. Confirm the import

### Step 13: Configure Validator Password

Create a password file for automatic validator startup:

```bash
echo "YOUR_WALLET_PASSWORD" > ~/prysm/pass.txt
chmod 600 ~/prysm/pass.txt
```

### Step 14: Start Validator Service

Once keys are imported and the beacon chain is synced:

```bash
sudo systemctl start validator
sudo systemctl enable validator
sudo systemctl status validator
```

### Step 15: Verify Validator Operation

Check validator logs:

```bash
sudo journalctl -fu validator

# Look for messages like:
# "Validator activated"
# "Submitted new attestation"
# "Proposed new block"
```

## Phase 4: Optional RPC Endpoint Setup

### Step 16: Install Nginx (Optional)

If you want to provide RPC access:

```bash
./install_nginx.sh
```

This configures:
- Reverse proxy for Geth RPC
- WebSocket endpoint support
- Basic rate limiting
- Security headers

### Step 17: Configure SSL (Optional)

For HTTPS support, first ensure your domain points to your server's IP.

#### Using ACME (Recommended):

```bash
./install_acme_ssl.sh
```

#### Or using Certbot:

```bash
./install_ssl_certbot.sh
```

### Step 18: Test RPC Endpoint

Test your RPC locally:

```bash
curl -X POST http://localhost/rpc \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  -H 'Content-Type: application/json'
```

Test from external source (if configured):

```bash
curl -X POST https://your-domain.com/rpc \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  -H 'Content-Type: application/json'
```

## Phase 5: Monitoring and Maintenance

### Essential Monitoring Commands

Create an alias for quick status checks:

```bash
echo 'alias nodestatus="sudo systemctl status eth1 cl validator mev"' >> ~/.bashrc
source ~/.bashrc
```

Now you can quickly check all services:
```bash
nodestatus
```

### Log Monitoring

View logs in real-time:

```bash
# All logs together
sudo journalctl -f -u eth1 -u cl -u validator -u mev

# Individual service logs
sudo journalctl -fu eth1      # Execution client
sudo journalctl -fu cl        # Consensus client
sudo journalctl -fu validator # Validator
sudo journalctl -fu mev       # MEV-Boost
```

### Disk Space Management

Monitor disk usage:

```bash
df -h
du -sh /var/lib/goethereum  # Geth data
du -sh ~/prysm               # Prysm data
```

### Performance Monitoring

Check resource usage:

```bash
htop  # CPU and memory usage
iotop # Disk I/O monitoring
nethogs # Network usage by process
```

## Troubleshooting Common Issues

### Node Won't Sync

1. **Check peer connections:**
   ```bash
   sudo geth attach http://localhost:8545
   > net.peerCount
   ```
   Should return > 0

2. **Verify firewall rules:**
   ```bash
   sudo ufw status
   ```

3. **Ensure time sync:**
   ```bash
   timedatectl status
   ```

### High Resource Usage

1. **Reduce cache if RAM limited:**
   Edit `exports.sh`, lower `GETH_CACHE`
   
2. **Limit peer connections:**
   Reduce `MAX_PEERS` in `exports.sh`

3. **Check for disk I/O bottleneck:**
   ```bash
   iostat -x 1
   ```

### Service Fails to Start

1. **Check service logs:**
   ```bash
   sudo journalctl -xe -u SERVICE_NAME
   ```

2. **Verify configuration files:**
   ```bash
   ls -la ~/prysm/*.yaml
   ls -la ~/secrets/jwt.hex
   ```

3. **Ensure proper permissions:**
   ```bash
   sudo chown -R eth:eth ~/prysm
   sudo chown -R eth:eth ~/secrets
   ```

## Security Best Practices

### Regular Updates

Keep your system and clients updated:

```bash
cd ~/eth2-quickstart
./update.sh
```

### Backup Critical Files

Always backup:
- Validator keys (store offline!)
- `~/prysm/direct/accounts` (encrypted validator data)
- `~/secrets/jwt.hex` (can regenerate if lost)
- Your configuration files

### Monitor Security Logs

Check for suspicious activity:

```bash
sudo fail2ban-client status
sudo grep "Failed password" /var/log/auth.log
sudo last -10  # Recent logins
```

### Firewall Hardening

After everything works, consider:

```bash
# Disable root SSH entirely
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

## Next Steps

Congratulations! You now have a fully operational Ethereum node. Here's what to do next:

1. **Monitor your node** for 24-48 hours to ensure stability
2. **Set up alerts** for service failures (use monitoring tools like Grafana)
3. **Join the community** for support and updates
4. **Consider redundancy** - run a backup node if operating a validator
5. **Document your setup** - keep notes on any customizations

## Useful Resources

- **Check sync status**: https://beaconcha.in
- **Validator monitoring**: https://beaconcha.in/validator/YOUR_VALIDATOR_PUBKEY
- **Network statistics**: https://etherscan.io/nodetracker
- **Client documentation**:
  - Geth: https://geth.ethereum.org/docs
  - Prysm: https://docs.prylabs.network
  - MEV-Boost: https://boost.flashbots.net

## Conclusion

You've successfully transformed a bare server into a professional-grade Ethereum node. This setup provides:

- **Security**: Hardened system with multiple protection layers
- **Performance**: Optimized client configurations
- **Reliability**: Systemd service management with auto-restart
- **Profitability**: MEV-Boost integration for maximum rewards
- **Sovereignty**: Complete control over your blockchain interaction

Remember, running a node is an ongoing responsibility. Regular monitoring, updates, and maintenance ensure your node continues contributing to Ethereum's decentralization and security.

In the next article, we'll explore advanced topics including client selection strategies, performance optimization, and scaling considerations.

---

*This is part 2 of a 5-part series on eth2-quickstart. Next up: "Choosing the Right Clients: A Deep Dive into Ethereum Client Diversity"*