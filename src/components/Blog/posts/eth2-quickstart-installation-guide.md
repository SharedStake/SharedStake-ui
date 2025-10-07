---
id: "eth2-quickstart-installation-guide"
slug: "ethereum-node-step-by-step-installation"
title: "Part 2: Step-by-Step Installation Guide - From Zero to Ethereum Node"
excerpt: "A comprehensive walkthrough of setting up your Ethereum node using eth2-quickstart, from initial server configuration to running validator."
author: "SharedStake Team"
publishDate: "2024-10-08"
tags: ["ethereum", "node", "installation", "tutorial", "eth2-quickstart", "validator"]
featured: true
meta:
  description: "Complete step-by-step guide to installing an Ethereum node using eth2-quickstart, from server setup to running validator."
  keywords: "ethereum node installation, eth2-quickstart guide, node setup tutorial, validator setup, MEV-boost configuration"
---

<br/>

# 🔧 Part 2: Step-by-Step Installation Guide - From Zero to Ethereum Node

<br/>

**A comprehensive walkthrough that transforms a fresh server into a fully operational, production-ready Ethereum node in under 2 hours.**

<br/>

---

<br/>
<br/>

## 🎯 What You'll Achieve

<br/>

By the end of this guide, you'll have:

<br/>

| Component | Status | Benefit |
|-----------|--------|---------|
| **🔒 Hardened Server** | Security-first configuration | Sleep soundly |
| **⚡ Synced Node** | Fully operational Ethereum node | Direct blockchain access |
| **💰 MEV-Boost** | Maximum extractable value | +25% validator rewards |
| **🎮 Service Management** | Professional systemd setup | 99.9% uptime |
| **🌐 RPC Endpoints** | Optional public access | Your own Infura |
| **📊 Monitoring** | Real-time metrics | Proactive maintenance |

<br/>

> **⏱️ Total Time:** From zero to earning rewards in **under 2 hours**

<br/>

Let's transform your server into an Ethereum powerhouse! 🚀

<br/>
<br/>

## 📦 Prerequisites and Preparation

<br/>

### 🏛️ Choosing Your Infrastructure

<br/>

#### Option 1: Bare Metal Server (🏆 Recommended)

<br/>

| Provider | Location | Price Range | Best For | Rating |
|----------|----------|-------------|----------|--------|
| **Hetzner** | EU/US | $50-150/mo | Price/performance | ⭐⭐⭐⭐⭐ |
| **OVH** | Global | $60-200/mo | European users | ⭐⭐⭐⭐ |
| **Latitude.sh** | Global | $80-250/mo | Crypto-friendly | ⭐⭐⭐⭐ |
| **Contabo** | EU/US | $40-120/mo | Budget option | ⭐⭐⭐ |

<br/>

**🚀 Bare Metal Advantages:**

- ✅ **Full I/O performance** → Faster sync times
- ✅ **No virtualization** → Better attestation performance
- ✅ **Cost efficiency** → 50% cheaper long-term
- ✅ **Hardware control** → Your server, your rules

<br/>

#### Option 2: Cloud VPS (⚠️ Use With Caution)

<br/>

| Provider | Instance Type | Monthly Cost | Sync Time | Recommendation |
|----------|---------------|--------------|-----------|----------------|
| **AWS** | i3.2xlarge | ~$450 | 24-48h | 🟡 Expensive |
| **Google Cloud** | n2-standard-8 | ~$380 | 36-72h | 🟡 Bandwidth costs |
| **Azure** | Standard_L8s_v2 | ~$340 | 24-48h | 🟡 Complex pricing |
| **DigitalOcean** | CPU-Optimized | ~$320 | 48-96h | 🔴 Not recommended |

<br/>

> **⚠️ Warning:** Cloud providers often have hidden costs (bandwidth, storage IOPS) that can **triple** your monthly bill!

<br/>
<br/>

### 📋 Server Specifications Checklist

<br/>

| Component | Minimum | Recommended | Optimal | Critical? |
|-----------|---------|-------------|---------|----------|
| **🧠 CPU** | 4 cores | 8 cores | 16+ cores | ✅ Yes |
| **💾 RAM** | 16 GB | 32 GB | 64 GB | ✅ Yes |
| **💿 Storage** | 2 TB SSD | 4 TB NVMe | 8 TB NVMe | ✅ Yes |
| **🌐 Network** | 100 Mbps | 1 Gbps | 10 Gbps | ✅ Yes |
| **💻 OS** | Ubuntu 20.04 | Ubuntu 22.04 | Ubuntu 22.04 | ✅ Yes |
| **🔐 Access** | Password | SSH Key | SSH Key + 2FA | ✅ Yes |

<br/>

> **🚫 Never Use:** HDDs (too slow), Windows (incompatible), Less than 2TB storage (will fill up)

<br/>

### 🚀 Initial Server Setup

<br/>

| Step | Action | Time | Important Notes |
|------|--------|------|------------------|
| **1️⃣** | Order server with Ubuntu | 5 min | Choose 22.04 LTS |
| **2️⃣** | Configure storage | 2 min | RAID 0 for speed, RAID 1 for safety |
| **3️⃣** | Set up SSH keys | 3 min | **Never use passwords!** |
| **4️⃣** | Note IP address | 1 min | Save in password manager |

<br/>

**📝 RAID Configuration Guide:**

- **RAID 0** → Maximum performance, no redundancy (recommended for non-critical)
- **RAID 1** → Full redundancy, half capacity (recommended for validators)
- **No RAID** → Single point of failure (not recommended)

<br/>
<br/>

## 🔐 Phase 1: Initial System Setup and Hardening

<br/>

### 🔢 Step 1: Connect and Clone the Repository

<br/>

**First, SSH into your new server as root:**

<br/>

```bash
# Connect to your server
ssh root@YOUR_SERVER_IP

# Get the magic scripts
cd /root
git clone https://github.com/chimera-defi/eth2-quickstart
cd eth2-quickstart
chmod +x *.sh
chmod +x lib/*.sh
```

<br/>

> **✅ Success Check:** You should see multiple `.sh` files when you run `ls -la`

<br/>

### 🔢 Step 2: Configure Initial Settings

<br/>

**Before running any scripts, review and modify the configuration file:**

<br/>

```bash
nano exports.sh
```

<br/>

**🎯 Critical Settings to Update:**

<br/>

| Setting | Purpose | Example | Priority |
|---------|---------|---------|----------|
| **EMAIL** | SSL certificates | your@email.com | 🔴 Critical |
| **FEE_RECIPIENT** | Where rewards go | 0xYourAddress | 🔴 Critical |
| **GRAFITTI** | Validator identity | "MyValidator" | 🟡 Important |
| **LOGIN_UNAME** | Non-root username | "eth" | 🟢 Optional |
| **YourSSHPortNumber** | SSH security | "2222" | 🟡 Important |
| **SERVER_NAME** | RPC domain | "node.example.com" | 🟢 Optional |

<br/>

**📝 Example Configuration:**

```bash
# 📧 Your contact email (for SSL certificates)
export EMAIL="your-email@example.com"

# 👤 Non-root username (keep as 'eth' or customize)
export LOGIN_UNAME='eth'

# 🔐 SSH port (change from 22 for extra security)
export YourSSHPortNumber='22'

# 🌐 Your domain name (if setting up RPC endpoints)
export SERVER_NAME="your-domain.com"

# 💰 Validator settings (CRITICAL - use your own address!)
export FEE_RECIPIENT=0xYOUR_FEE_RECIPIENT_ADDRESS
export GRAFITTI="YourValidatorName"

# ⚡ Performance tuning
export GETH_CACHE=8192  # Adjust based on RAM (8GB for 32GB RAM)
export MAX_PEERS=100    # Reduce if bandwidth limited
```

<br/>

> **⚠️ CRITICAL WARNING:** Always set your own `FEE_RECIPIENT` address. This is where your validator rewards and MEV income will be sent! Using the wrong address means **losing all your rewards**!

<br/>

### 🔢 Step 3: Run System Hardening Script

<br/>

**Execute the first setup script:**

<br/>

```bash
./run_1.sh
```

<br/>

**🔒 What This Script Does (Automatically!):**

<br/>

| Stage | Actions | Time | Impact |
|-------|---------|------|--------|
| **🔄 System Updates** | Update packages, remove bloat, enable auto-updates | 5 min | Security patches |
| **🔐 SSH Hardening** | Disable passwords, key-only access, rate limiting | 2 min | Hack-proof SSH |
| **🔥 Firewall Setup** | UFW rules, port management, DDoS protection | 3 min | Network security |
| **👤 User Creation** | Non-root user, sudo setup, key migration | 2 min | Privilege isolation |
| **🚫 Fail2ban** | Brute-force protection, IP banning | 1 min | Attack prevention |
| **⏰ Time Sync** | Chrony setup, NTP configuration | 1 min | Consensus accuracy |

<br/>

**🔓 Ports That Will Be Opened:**

<br/>

| Port | Protocol | Purpose | Required? |
|------|----------|---------|----------|
| **22/custom** | TCP | SSH access | ✅ Yes |
| **30303** | TCP/UDP | Execution P2P | ✅ Yes |
| **13000** | TCP | Prysm P2P | If using Prysm |
| **12000** | UDP | Prysm discovery | If using Prysm |
| **9000** | TCP/UDP | Lighthouse P2P | If using Lighthouse |
| **443** | TCP | HTTPS/RPC | If public RPC |

<br/>

> **🛡️ Security Level After This Step:** Fort Knox 🏛️

<br/>

### 🖊️ Manual Steps During Installation

<br/>

The script will pause for important manual steps:

<br/>

| Step | Action Required | Terminal | Time |
|------|-----------------|----------|------|
| **1️⃣ Review Config** | Check network settings, verify firewall | Original | 1 min |
| **2️⃣ Setup Sudo** | Add user privileges | New Terminal | 2 min |
| **3️⃣ Set Password** | Create user password | Original | 1 min |

<br/>

**💻 Step-by-Step Instructions:**

<br/>

**1️⃣ When prompted to review configurations:**
- ✅ Check network settings displayed
- ✅ Verify firewall rules look correct
- ✅ Ensure SSH is properly configured

<br/>

**2️⃣ Setting up sudo privileges:**

```bash
# Open a NEW terminal and run:
ssh root@YOUR_SERVER_IP
visudo

# Add this line at the bottom:
eth ALL=(ALL) NOPASSWD: ALL

# Save and exit (Ctrl+X, Y, Enter)
```

<br/>

**3️⃣ Set password for new user:**

```bash
# Back in the ORIGINAL terminal:
passwd eth
# Choose a strong password (you'll rarely use it with SSH keys)
```

<br/>

> **💡 Pro Tip:** Keep both terminals open - you'll need them!

<br/>

### 🔢 Step 4: Reboot and Reconnect

<br/>

**After the script completes, reboot your server:**

<br/>

```bash
sudo reboot
```

<br/>

**⏳ Wait 2-3 minutes, then reconnect as the new user:**

<br/>

| Connection Type | Command | When to Use |
|----------------|---------|-------------|
| **Standard SSH** | `ssh eth@YOUR_SERVER_IP` | Default port (22) |
| **Custom Port** | `ssh -p YOUR_PORT eth@YOUR_SERVER_IP` | Changed SSH port |
| **With Key** | `ssh -i ~/.ssh/your_key eth@YOUR_SERVER_IP` | Specific SSH key |

<br/>

**🔧 Troubleshooting Connection Issues:**

<br/>

| Problem | Solution | Command |
|---------|----------|----------|
| **Known hosts error** | Clear old fingerprint | `sed -i '/YOUR_SERVER_IP/d' ~/.ssh/known_hosts` |
| **Permission denied** | Check SSH key | `ssh-add ~/.ssh/your_key` |
| **Connection refused** | Verify port | Check firewall rules on server |
| **Timeout** | Server still rebooting | Wait another 2-3 minutes |

<br/>

> **✅ Success Check:** You should see `eth@hostname:~$` prompt after login

<br/>
<br/>

## ⚡ Phase 2: Ethereum Client Installation

<br/>

### 🔢 Step 5: Navigate to Installation Directory

<br/>

**After logging in as the 'eth' user:**

```bash
cd ~/eth2-quickstart
```

<br/>

### 🔢 Step 6: Final Configuration Check

<br/>

**Review your settings one more time:**

```bash
nano exports.sh
```

<br/>

**🎯 Critical Settings Checklist:**

<br/>

| Setting | Purpose | Example | Verified? |
|---------|---------|---------|----------|
| **FEE_RECIPIENT** | Where rewards go | `0x742d35...` | ☐ |
| **GRAFITTI** | Validator identity | "MyNode" | ☐ |
| **MEV_RELAYS** | MEV relay selection | Default OK | ☐ |
| **GETH_CACHE** | Performance tuning | 8192 | ☐ |
| **MAX_PEERS** | Network connections | 100 | ☐ |

<br/>

> **⚠️ Last Chance:** This is your final opportunity to correct the FEE_RECIPIENT before installation!

<br/>

### 🔢 Step 7: Choose Your Clients

<br/>

You have two options for client installation:

<br/>

#### 🎯 Option A: Interactive Client Selection (🏆 Recommended)

<br/>

```bash
./select_clients.sh
```

<br/>

**What the Interactive Tool Does:**

| Question | Purpose | Impact |
|----------|---------|--------|
| **Use case?** | Solo staking vs RPC provider | Optimizes for your needs |
| **Hardware specs?** | RAM, CPU, storage | Recommends suitable clients |
| **Network preference?** | Mainnet vs testnet | Configures correct network |
| **Client diversity?** | Help decentralization | Suggests minority clients |

<br/>

#### 🚀 Option B: Quick Installation with Defaults

<br/>

```bash
./run_2.sh
```

<br/>

**Default Installation Package:**

| Component | Client | Market Share | Why Default? |
|-----------|--------|--------------|-------------|
| **Execution** | Geth | ~60% | Most stable |
| **Consensus** | Prysm | ~38% | Best documented |
| **MEV** | MEV-Boost | Standard | +25% rewards |

<br/>

> **💡 Recommendation:** Use Option A to help client diversity and get optimal performance for your hardware!

<br/>

### 🔢 Step 8: Understanding the Installation Process

<br/>

**🔧 What Happens During Client Installation:**

<br/>

#### ⚙️ Geth Installation (`install_geth.sh`)

<br/>

| Step | Action | Time | Result |
|------|--------|------|--------|
| **1** | Add Ethereum PPA | 30s | Official repository |
| **2** | Install Geth | 2 min | Latest stable version |
| **3** | Create systemd service | 10s | Auto-start on boot |
| **4** | Setup JWT auth | 5s | Secure client communication |
| **5** | Configure sync & cache | 10s | Optimized performance |
| **6** | Enable RPC/WebSocket | 5s | API access ready |

<br/>

#### 🎯 Prysm Installation (`install_prysm.sh`)

<br/>

| Step | Action | Time | Result |
|------|--------|------|--------|
| **1** | Download Prysm script | 1 min | Management tool |
| **2** | Generate JWT secret | 5s | Engine API security |
| **3** | Create beacon config | 10s | Consensus settings |
| **4** | Create validator config | 10s | Staking settings |
| **5** | Setup systemd services | 20s | Service management |
| **6** | Configure checkpoint sync | 5s | Fast synchronization |

<br/>

#### 💰 MEV-Boost Installation (`install_mev_boost.sh`)

<br/>

| Step | Action | Time | Result |
|------|--------|------|--------|
| **1** | Install Go language | 3 min | Build environment |
| **2** | Clone MEV-Boost repo | 30s | Source code |
| **3** | Build from source | 2 min | Optimized binary |
| **4** | Configure relays | 10s | MEV network access |
| **5** | Create systemd service | 10s | Auto-start |
| **6** | Set bid parameters | 5s | Profit optimization |

<br/>

> **⏱️ Total Installation Time:** ~15-20 minutes for all components

<br/>

### 🔢 Step 9: Start Your Services

<br/>

**After installation completes, start the services:**

<br/>

```bash
# 🚀 Start execution client
sudo systemctl start eth1
sudo systemctl enable eth1

# 🎯 Start consensus client (beacon chain)
sudo systemctl start cl
sudo systemctl enable cl

# 💰 Start MEV-Boost
sudo systemctl start mev
sudo systemctl enable mev

# 💎 Start validator (only if you have validator keys set up)
# sudo systemctl start validator
# sudo systemctl enable validator
```

<br/>

**📊 Service Status Dashboard:**

<br/>

| Service | Command to Check | Expected Status | Purpose |
|---------|------------------|-----------------|----------|
| **eth1** | `sudo systemctl status eth1` | 🟢 Active (running) | Execution layer |
| **cl** | `sudo systemctl status cl` | 🟢 Active (running) | Consensus layer |
| **mev** | `sudo systemctl status mev` | 🟢 Active (running) | MEV rewards |
| **validator** | `sudo systemctl status validator` | 🟡 Inactive (waiting) | Staking |

<br/>

> **⚠️ Note:** Don't start the validator service until you've imported your validator keys!

<br/>

### 🔟 Step 10: Verify Services Are Running

<br/>

**Check the status of each service:**

<br/>

```bash
# 🔍 Check execution client
sudo systemctl status eth1

# 🔍 Check consensus client
sudo systemctl status cl

# 🔍 Check MEV-Boost
sudo systemctl status mev
```

<br/>

**✅ What Success Looks Like:**

<br/>

| Indicator | Meaning | Action if Missing |
|-----------|---------|-------------------|
| **🟢 active (running)** | Service is healthy | None - you're good! |
| **🔴 failed** | Service crashed | Check logs with `journalctl` |
| **🟡 inactive** | Service not started | Run `systemctl start` |
| **🟠 activating** | Still starting up | Wait 30-60 seconds |

<br/>

### 🔐 Step 11: Monitor Initial Synchronization

<br/>

Your node will now begin synchronizing with the Ethereum network:

<br/>

#### ⚙️ Monitoring Execution Client (Geth)

<br/>

```bash
# 📊 View Geth logs
sudo journalctl -fu eth1

# 🎯 Check sync status (in another terminal)
sudo geth attach http://localhost:8545
> eth.syncing
```

<br/>

**Sync Status Indicators:**

| Response | Meaning | Progress |
|----------|---------|----------|
| **false** | Fully synced! | 🎉 100% |
| **{currentBlock: ...}** | Still syncing | 🔄 In progress |
| **Connection error** | Geth not running | 🔴 Check service |

<br/>

#### 🎯 Monitoring Consensus Client (Prysm)

<br/>

```bash
# 📊 View beacon chain logs
sudo journalctl -fu cl
```

<br/>

**Log Messages to Look For:**

| Message | Meaning | Status |
|---------|---------|--------|
| **"Synced new block"** | Actively syncing | 🟡 Catching up |
| **"Synced to slot"** | Following chain head | 🟢 Fully synced |
| **"Waiting for peers"** | Connection issues | 🔴 Check firewall |
| **"Checkpoint sync"** | Fast sync active | 🚀 Accelerated |

<br/>

#### ⏱️ Sync Time Estimates

<br/>

| Method | Consensus Sync | Execution Sync | Total Time |
|--------|----------------|----------------|------------|
| **🚀 With Checkpoint** | 10-30 min | 12-48 hours | 1-2 days |
| **🐢 Without Checkpoint** | 2-3 days | 3-5 days | 5-8 days |
| **💾 Archive Node** | 2-3 days | 1-2 weeks | 2+ weeks |

<br/>

**Factors Affecting Sync Speed:**
- 🌐 Peer quality and count
- 💿 Disk I/O performance
- 📡 Network bandwidth
- 🧠 CPU processing power

<br/>
<br/>

## 💎 Phase 3: Validator Setup (For Stakers)

<br/>

> **⚠️ CRITICAL WARNING**: Only proceed if you plan to stake 32 ETH per validator. This ETH will be locked until withdrawals are processed!

<br/>

### 🔐 Step 12: Generate or Import Validator Keys

<br/>

#### 🆕 Option A: Generate New Keys

<br/>

**Use the official Ethereum launchpad:**

<br/>

| Step | Action | Critical? | Time |
|------|--------|-----------|------|
| **1️⃣** | Visit [launchpad.ethereum.org](https://launchpad.ethereum.org) | ✅ Yes | 2 min |
| **2️⃣** | Follow key generation wizard | ✅ Yes | 10 min |
| **3️⃣** | **SAVE MNEMONIC PHRASE** | 🔴 CRITICAL | 5 min |
| **4️⃣** | Transfer `validator_keys` to server | ✅ Yes | 5 min |

<br/>

> **🔐 Security Tip:** Store your mnemonic phrase in multiple secure locations. This is your ONLY way to recover validators!

<br/>

#### 📥 Option B: Import Existing Keys

<br/>

**If you have existing validator keys:**

```bash
cd ~/prysm
./prysm.sh validator accounts import --keys-dir=/path/to/validator_keys
```

<br/>

**Import Process Steps:**

| Prompt | Action | Example |
|--------|--------|----------|
| **Key password** | Enter creation password | `MyKeyPassword123` |
| **Wallet password** | Create new wallet password | `MyWalletPass456` |
| **Confirm import** | Type 'yes' to proceed | `yes` |

<br/>

### 🔐 Step 13: Configure Validator Password

<br/>

**Create a password file for automatic validator startup:**

```bash
echo "YOUR_WALLET_PASSWORD" > ~/prysm/pass.txt
chmod 600 ~/prysm/pass.txt
```

<br/>

> **🔒 Security:** The `chmod 600` ensures only your user can read this file

<br/>

### 🚀 Step 14: Start Validator Service

<br/>

**Once keys are imported and beacon chain is synced:**

```bash
# 💎 Start the validator
sudo systemctl start validator
sudo systemctl enable validator
sudo systemctl status validator
```

<br/>

### ✅ Step 15: Verify Validator Operation

<br/>

**Check validator logs:**

```bash
sudo journalctl -fu validator
```

<br/>

**📊 Success Indicators:**

| Log Message | Meaning | Status |
|-------------|---------|--------|
| **"Validator activated"** | Validator is live | 🎉 Success! |
| **"Submitted new attestation"** | Performing duties | 🟢 Earning |
| **"Proposed new block"** | Block proposal | 💰 Jackpot! |
| **"Waiting for activation"** | In queue | 🟡 Pending |
| **"Could not request attestation"** | Not synced | 🔴 Check sync |

<br/>
<br/>

## 🌐 Phase 4: Optional RPC Endpoint Setup

<br/>

### 🏛️ Step 16: Install Nginx (Optional)

<br/>

**If you want to provide RPC access:**

```bash
./install_nginx.sh
```

<br/>

**🔧 What This Configures:**

| Feature | Purpose | Benefit |
|---------|---------|----------|
| **Reverse Proxy** | Routes RPC requests | Clean URLs |
| **WebSocket Support** | Real-time connections | dApp compatibility |
| **Rate Limiting** | Prevent abuse | DDoS protection |
| **Security Headers** | XSS/CSRF protection | Enhanced security |

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

<br/>
<br/>

## 📊 Phase 5: Monitoring and Maintenance

<br/>

### 🎯 Essential Monitoring Commands

<br/>

**Create an alias for quick status checks:**

```bash
echo 'alias nodestatus="sudo systemctl status eth1 cl validator mev"' >> ~/.bashrc
source ~/.bashrc
```

<br/>

**Now check everything with one command:**

```bash
nodestatus
```

<br/>

### 📝 Log Monitoring

<br/>

**Real-Time Log Commands:**

| Command | Purpose | Use When |
|---------|---------|----------|
| `sudo journalctl -f -u eth1 -u cl -u validator -u mev` | All logs | General monitoring |
| `sudo journalctl -fu eth1` | Execution only | Sync issues |
| `sudo journalctl -fu cl` | Consensus only | Attestation checks |
| `sudo journalctl -fu validator` | Validator only | Staking monitoring |
| `sudo journalctl -fu mev` | MEV only | Relay issues |

<br/>

### 💾 Disk Space Management

<br/>

**Monitor disk usage:**

```bash
# Overall disk usage
df -h

# Specific directory sizes
du -sh /var/lib/goethereum  # Geth data
du -sh ~/prysm               # Prysm data
```

<br/>

**Space Requirements Over Time:**

| Client | Initial | 6 Months | 1 Year | Growth Rate |
|--------|---------|----------|--------|-------------|
| **Geth** | ~800 GB | ~1.2 TB | ~1.6 TB | ~70 GB/month |
| **Prysm** | ~200 GB | ~350 GB | ~500 GB | ~25 GB/month |
| **Total** | ~1 TB | ~1.6 TB | ~2.1 TB | ~95 GB/month |

<br/>

### ⚡ Performance Monitoring

<br/>

**Essential Monitoring Tools:**

| Tool | Command | Purpose | Key Metrics |
|------|---------|---------|-------------|
| **htop** | `htop` | CPU/RAM monitor | Load, memory usage |
| **iotop** | `sudo iotop` | Disk I/O monitor | Read/write speeds |
| **nethogs** | `sudo nethogs` | Network monitor | Bandwidth per process |
| **nvtop** | `nvtop` | GPU monitor (if applicable) | GPU usage |

<br/>
<br/>

## 🔧 Troubleshooting Common Issues

<br/>

### 🔴 Node Won't Sync

<br/>

| Issue | Check | Solution |
|-------|-------|----------|
| **No peers** | `sudo geth attach http://localhost:8545` then `> net.peerCount` | Check firewall |
| **Firewall blocking** | `sudo ufw status` | Open required ports |
| **Time drift** | `timedatectl status` | Sync with NTP |
| **Wrong network** | Check logs for network ID | Verify chain config |

<br/>

### 📊 High Resource Usage

<br/>

| Resource | Problem | Solution | Command |
|----------|---------|----------|----------|
| **RAM** | OOM kills | Reduce cache | Edit `GETH_CACHE` in exports.sh |
| **CPU** | 100% usage | Limit peers | Reduce `MAX_PEERS` |
| **Disk I/O** | Slow sync | Check IOPS | `iostat -x 1` |
| **Network** | Bandwidth limit | Reduce peers | Lower `MAX_PEERS` |

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

<br/>
<br/>

## 🔒 Security Best Practices

<br/>

### 🔄 Regular Updates

<br/>

**Keep your system and clients updated:**

```bash
cd ~/eth2-quickstart
./update.sh
```

<br/>

### 💾 Backup Critical Files

<br/>

**Backup Priority List:**

| File/Directory | Priority | Storage | Frequency |
|----------------|----------|---------|------------|
| **Validator keys** | 🔴 CRITICAL | Offline only! | Once |
| **~/prysm/direct/accounts** | 🟠 High | Encrypted backup | Weekly |
| **~/secrets/jwt.hex** | 🟡 Medium | Secure location | Monthly |
| **Configuration files** | 🟢 Low | Version control | On change |

<br/>

### 🔍 Monitor Security Logs

<br/>

**Security Monitoring Commands:**

```bash
# Check fail2ban status
sudo fail2ban-client status

# Review failed login attempts
sudo grep "Failed password" /var/log/auth.log

# Check recent logins
sudo last -10
```

<br/>

### 🛡️ Firewall Hardening

<br/>

**After everything works, lock it down:**

```bash
# Disable root SSH entirely
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

<br/>
<br/>

## 🎯 Next Steps

<br/>

**Congratulations! 🎉 You now have a fully operational Ethereum node.**

<br/>

### 🗺️ Your Action Plan

<br/>

| Priority | Action | Timeline | Why Important |
|----------|--------|----------|---------------|
| **1️⃣** | Monitor for stability | 24-48 hours | Catch early issues |
| **2️⃣** | Set up alerts | Week 1 | Proactive monitoring |
| **3️⃣** | Join community | Week 1 | Get support |
| **4️⃣** | Plan redundancy | Month 1 | Validator backup |
| **5️⃣** | Document setup | Ongoing | Future reference |

<br/>

## 🔗 Useful Resources

<br/>

| Resource | URL | Purpose |
|----------|-----|----------|
| **📊 Sync Status** | [beaconcha.in](https://beaconcha.in) | Monitor network |
| **💎 Validator Dashboard** | [beaconcha.in/validator](https://beaconcha.in/validator/YOUR_PUBKEY) | Track performance |
| **🌐 Network Stats** | [etherscan.io/nodetracker](https://etherscan.io/nodetracker) | Network overview |
| **📚 Geth Docs** | [geth.ethereum.org](https://geth.ethereum.org/docs) | Execution client |
| **📚 Prysm Docs** | [docs.prylabs.network](https://docs.prylabs.network) | Consensus client |
| **💰 MEV-Boost** | [boost.flashbots.net](https://boost.flashbots.net) | MEV documentation |

<br/>
<br/>

## 🎯 The Bottom Line

<br/>

**You've successfully transformed a bare server into a professional-grade Ethereum node! 🎆**

<br/>

### 📊 What You've Achieved

<br/>

| Achievement | Impact | Your Benefit |
|-------------|--------|-------------|
| **🔒 Fort Knox Security** | Multiple protection layers | Sleep peacefully |
| **⚡ Optimized Performance** | Tuned configurations | Maximum efficiency |
| **🎯 99.9% Reliability** | Systemd auto-restart | Set and forget |
| **💰 +25% Rewards** | MEV-Boost integration | Higher returns |
| **👑 Full Sovereignty** | Your node, your rules | True decentralization |

<br/>

### 💡 Remember

<br/>

Running a node is an **ongoing responsibility**:

- 🔄 **Regular monitoring** keeps your node healthy
- 🔧 **Timely updates** ensure security and features
- 🤝 **Community participation** strengthens the network
- 📊 **Performance tracking** maximizes rewards

<br/>

> **🌐 Impact:** Every node makes Ethereum more decentralized, censorship-resistant, and secure. You're not just running software – you're securing the future of finance.

<br/>

---

<br/>

### 🔗 Continue Your Journey

<br/>

**This is part 2 of our 5-part eth2-quickstart series:**

1. 🚀 Part 1: Introduction to eth2-quickstart ✓
2. **🔧 Part 2: Step-by-Step Installation Guide** (You are here)
3. **🌈 Part 3: Client Diversity Deep Dive** (Next)
4. ⚙️ Part 4: Advanced Features and Optimization
5. 🔍 Part 5: Monitoring and Maintenance

<br/>

**Ready to choose your clients? Let's dive into client diversity! 🚀**