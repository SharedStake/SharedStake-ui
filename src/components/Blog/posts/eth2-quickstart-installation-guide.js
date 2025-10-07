export default {
  id: 'eth2-quickstart-2',
  slug: 'ethereum-node-step-by-step-installation-guide',
  title: 'Step-by-Step Installation Guide: From Zero to Ethereum Node',
  excerpt: 'A comprehensive walkthrough of setting up your Ethereum node using eth2-quickstart, from initial server configuration to running validator.',
  content: `
    <h2>Introduction</h2>
    <p>Welcome to the practical guide for setting up your Ethereum node using eth2-quickstart. This comprehensive walkthrough will take you from a fresh server to a fully operational Ethereum node, complete with execution client, consensus client, validator, and MEV-Boost integration.</p>
    
    <p>By the end of this guide, you'll have:</p>
    <ul>
      <li>A security-hardened Ubuntu server</li>
      <li>A fully synchronized Ethereum node</li>
      <li>Professional-grade service management</li>
      <li>Optional RPC endpoints for your applications</li>
      <li>The knowledge to maintain and monitor your node</li>
    </ul>
    
    <h2>Prerequisites and Preparation</h2>
    
    <h3>Choosing Your Infrastructure</h3>
    
    <h4>Option 1: Bare Metal Server (Recommended)</h4>
    <p>Bare metal servers offer the best performance and reliability for Ethereum nodes. Popular providers include:</p>
    <ul>
      <li>Hetzner (excellent price/performance ratio)</li>
      <li>OVH (good European option)</li>
      <li>Latitude.sh (crypto-friendly hosting)</li>
    </ul>
    
    <p><strong>Advantages:</strong></p>
    <ul>
      <li>Full disk I/O performance</li>
      <li>No virtualization overhead</li>
      <li>Better long-term cost efficiency</li>
      <li>Complete hardware control</li>
    </ul>
    
    <h4>Option 2: Cloud VPS</h4>
    <p>While cloud providers can work, be aware of limitations:</p>
    <ul>
      <li>Higher long-term costs</li>
      <li>Potential I/O throttling</li>
      <li>May struggle with initial sync</li>
      <li>Watch for bandwidth charges</li>
    </ul>
    
    <h3>Server Specifications Checklist</h3>
    <pre><code>✓ CPU: 4-8+ cores (AMD Ryzen or Intel Xeon preferred)
✓ RAM: 16-64GB (32GB recommended)
✓ Storage: 2-4TB NVMe SSD (avoid HDDs!)
✓ Network: 1Gbps+ connection, unlimited bandwidth
✓ OS: Ubuntu 20.04 LTS or 22.04 LTS
✓ Access: SSH key authentication configured</code></pre>
    
    <h2>Phase 1: Initial System Setup and Hardening</h2>
    
    <h3>Step 1: Connect and Clone the Repository</h3>
    <p>First, SSH into your new server as root:</p>
    <pre><code>ssh root@YOUR_SERVER_IP</code></pre>
    
    <p>Clone the eth2-quickstart repository:</p>
    <pre><code>cd /root
git clone https://github.com/chimera-defi/eth2-quickstart
cd eth2-quickstart
chmod +x *.sh
chmod +x lib/*.sh</code></pre>
    
    <h3>Step 2: Configure Initial Settings</h3>
    <p>Before running any scripts, review and modify the configuration file:</p>
    <pre><code>nano exports.sh</code></pre>
    
    <p>Key settings to update:</p>
    <pre><code># Your contact email (important for SSL certificates)
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
export MAX_PEERS=100    # Reduce if bandwidth limited</code></pre>
    
    <p><strong>⚠️ CRITICAL</strong>: Always set your own <code>FEE_RECIPIENT</code> address. This is where your validator rewards and MEV income will be sent!</p>
    
    <h3>Step 3: Run System Hardening Script</h3>
    <p>Execute the first setup script:</p>
    <pre><code>./run_1.sh</code></pre>
    
    <p>This script performs critical security hardening:</p>
    
    <h4>What happens during run_1.sh:</h4>
    <ol>
      <li><strong>System Updates</strong>
        <ul>
          <li>Updates all packages to latest versions</li>
          <li>Removes unnecessary packages</li>
          <li>Configures automatic security updates</li>
        </ul>
      </li>
      <li><strong>SSH Hardening</strong>
        <ul>
          <li>Disables password authentication</li>
          <li>Configures key-only access</li>
          <li>Sets up rate limiting</li>
          <li>Changes default settings for security</li>
        </ul>
      </li>
      <li><strong>Firewall Configuration</strong>
        <ul>
          <li>Sets up UFW (Uncomplicated Firewall)</li>
          <li>Opens only necessary ports</li>
          <li>Blocks internal service ports from external access</li>
        </ul>
      </li>
      <li><strong>User Account Creation</strong>
        <ul>
          <li>Creates non-root user (default: 'eth')</li>
          <li>Sets up sudo privileges</li>
          <li>Copies SSH keys for the new user</li>
        </ul>
      </li>
      <li><strong>Fail2ban Installation</strong>
        <ul>
          <li>Protects against brute force attacks</li>
          <li>Monitors logs for suspicious activity</li>
          <li>Automatically bans malicious IPs</li>
        </ul>
      </li>
      <li><strong>Time Synchronization</strong>
        <ul>
          <li>Installs and configures Chrony</li>
          <li>Ensures accurate system time (critical for consensus)</li>
        </ul>
      </li>
    </ol>
    
    <h4>Manual Steps During Installation</h4>
    <p>The script will pause for important manual steps:</p>
    
    <ol>
      <li><strong>When prompted to review configurations:</strong>
        <ul>
          <li>Check the network settings displayed</li>
          <li>Verify firewall rules look correct</li>
          <li>Ensure SSH is properly configured</li>
        </ul>
      </li>
      <li><strong>Setting up sudo privileges:</strong>
        <p>Open a <strong>new terminal</strong> and run:</p>
        <pre><code>ssh root@YOUR_SERVER_IP
visudo</code></pre>
        <p>Add this line at the bottom:</p>
        <pre><code>eth ALL=(ALL) NOPASSWD: ALL</code></pre>
        <p>Save and exit (Ctrl+X, Y, Enter)</p>
      </li>
      <li><strong>Set password for new user:</strong>
        <p>Back in the original terminal:</p>
        <pre><code>passwd eth</code></pre>
        <p>Choose a strong password (you'll rarely use it with SSH keys)</p>
      </li>
    </ol>
    
    <h3>Step 4: Reboot and Reconnect</h3>
    <p>After the script completes:</p>
    <pre><code>sudo reboot</code></pre>
    
    <p>Wait 2-3 minutes, then reconnect as the new user:</p>
    <pre><code>ssh eth@YOUR_SERVER_IP</code></pre>
    
    <p>If you changed the SSH port:</p>
    <pre><code>ssh -p YOUR_PORT eth@YOUR_SERVER_IP</code></pre>
    
    <h2>Phase 2: Ethereum Client Installation</h2>
    
    <h3>Step 5: Navigate to Installation Directory</h3>
    <p>After logging in as the 'eth' user:</p>
    <pre><code>cd ~/eth2-quickstart</code></pre>
    
    <h3>Step 6: Choose Your Clients</h3>
    <p>You have two options for client installation:</p>
    
    <h4>Option A: Interactive Client Selection (Recommended for First-Time Users)</h4>
    <p>Run the client selection assistant:</p>
    <pre><code>./select_clients.sh</code></pre>
    
    <p>This interactive tool will:</p>
    <ul>
      <li>Ask about your use case (solo staking, RPC provider, etc.)</li>
      <li>Inquire about your hardware resources</li>
      <li>Recommend optimal client combinations</li>
      <li>Show you which install scripts to run</li>
    </ul>
    
    <h4>Option B: Quick Installation with Defaults</h4>
    <p>For a quick setup with the most popular clients (Geth + Prysm):</p>
    <pre><code>./run_2.sh</code></pre>
    
    <p>This installs:</p>
    <ul>
      <li><strong>Geth</strong> (execution client)</li>
      <li><strong>Prysm</strong> (consensus client)</li>
      <li><strong>MEV-Boost</strong> (MEV relay middleware)</li>
    </ul>
    
    <h3>Step 7: Understanding the Installation Process</h3>
    
    <h4>What happens during client installation:</h4>
    
    <p><strong>Geth Installation (<code>install_geth.sh</code>):</strong></p>
    <ol>
      <li>Adds Ethereum PPA repository</li>
      <li>Installs latest Geth version</li>
      <li>Creates systemd service configuration</li>
      <li>Sets up JWT authentication</li>
      <li>Configures sync mode and cache settings</li>
      <li>Enables JSON-RPC and WebSocket endpoints</li>
    </ol>
    
    <p><strong>Prysm Installation (<code>install_prysm.sh</code>):</strong></p>
    <ol>
      <li>Downloads Prysm management script</li>
      <li>Generates JWT secret for Engine API</li>
      <li>Creates configuration files</li>
      <li>Sets up systemd services for beacon and validator</li>
      <li>Configures checkpoint sync for faster synchronization</li>
    </ol>
    
    <p><strong>MEV-Boost Installation (<code>install_mev_boost.sh</code>):</strong></p>
    <ol>
      <li>Installs Go programming language</li>
      <li>Clones and builds MEV-Boost from source</li>
      <li>Configures relay endpoints</li>
      <li>Creates systemd service</li>
      <li>Sets up minimum bid and timeout parameters</li>
    </ol>
    
    <h3>Step 8: Start Your Services</h3>
    <p>After installation completes, start the services:</p>
    <pre><code># Start execution client
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
# sudo systemctl enable validator</code></pre>
    
    <h3>Step 9: Verify Services Are Running</h3>
    <p>Check the status of each service:</p>
    <pre><code># Check execution client
sudo systemctl status eth1

# Check consensus client
sudo systemctl status cl

# Check MEV-Boost
sudo systemctl status mev</code></pre>
    
    <p>You should see "active (running)" in green for each service.</p>
    
    <h3>Step 10: Monitor Initial Synchronization</h3>
    <p>Your node will now begin synchronizing with the Ethereum network. This process varies by client and network conditions:</p>
    
    <h4>Monitoring Execution Client (Geth):</h4>
    <pre><code># View Geth logs
sudo journalctl -fu eth1

# Check sync status (in another terminal)
sudo geth attach http://localhost:8545
> eth.syncing</code></pre>
    
    <p>When fully synced, <code>eth.syncing</code> returns <code>false</code>.</p>
    
    <h4>Monitoring Consensus Client (Prysm):</h4>
    <pre><code># View beacon chain logs
sudo journalctl -fu cl

# Look for messages like:
# "Synced new block" - actively syncing
# "Synced to slot" - following chain head</code></pre>
    
    <h4>Sync Time Estimates:</h4>
    <ul>
      <li><strong>With checkpoint sync</strong>: 10-30 minutes for consensus, 12-48 hours for execution</li>
      <li><strong>Without checkpoint sync</strong>: 2-5 days for full sync</li>
      <li><strong>Factors affecting sync speed</strong>: Peer quality, disk I/O, network bandwidth</li>
    </ul>
    
    <h2>Phase 3: Validator Setup (For Stakers)</h2>
    
    <p><strong>⚠️ IMPORTANT</strong>: Only proceed if you plan to stake 32 ETH per validator.</p>
    
    <h3>Step 11: Generate or Import Validator Keys</h3>
    
    <h4>Option A: Generate New Keys</h4>
    <p>Use the official Ethereum launchpad:</p>
    <ol>
      <li>Visit <a href="https://launchpad.ethereum.org" target="_blank">https://launchpad.ethereum.org</a></li>
      <li>Follow the key generation process</li>
      <li>Save your mnemonic phrase securely (CRITICAL!)</li>
      <li>Transfer the generated <code>validator_keys</code> folder to your server</li>
    </ol>
    
    <h4>Option B: Import Existing Keys</h4>
    <p>If you have existing validator keys:</p>
    <pre><code>cd ~/prysm
./prysm.sh validator accounts import --keys-dir=/path/to/validator_keys</code></pre>
    
    <p>You'll be prompted to:</p>
    <ol>
      <li>Enter the password used when creating keys</li>
      <li>Create a wallet password for Prysm</li>
      <li>Confirm the import</li>
    </ol>
    
    <h3>Step 12: Configure Validator Password</h3>
    <p>Create a password file for automatic validator startup:</p>
    <pre><code>echo "YOUR_WALLET_PASSWORD" > ~/prysm/pass.txt
chmod 600 ~/prysm/pass.txt</code></pre>
    
    <h3>Step 13: Start Validator Service</h3>
    <p>Once keys are imported and the beacon chain is synced:</p>
    <pre><code>sudo systemctl start validator
sudo systemctl enable validator
sudo systemctl status validator</code></pre>
    
    <h3>Step 14: Verify Validator Operation</h3>
    <p>Check validator logs:</p>
    <pre><code>sudo journalctl -fu validator

# Look for messages like:
# "Validator activated"
# "Submitted new attestation"
# "Proposed new block"</code></pre>
    
    <h2>Phase 4: Optional RPC Endpoint Setup</h2>
    
    <h3>Step 15: Install Nginx (Optional)</h3>
    <p>If you want to provide RPC access:</p>
    <pre><code>./install_nginx.sh</code></pre>
    
    <p>This configures:</p>
    <ul>
      <li>Reverse proxy for Geth RPC</li>
      <li>WebSocket endpoint support</li>
      <li>Basic rate limiting</li>
      <li>Security headers</li>
    </ul>
    
    <h3>Step 16: Configure SSL (Optional)</h3>
    <p>For HTTPS support, first ensure your domain points to your server's IP.</p>
    
    <h4>Using ACME (Recommended):</h4>
    <pre><code>./install_acme_ssl.sh</code></pre>
    
    <h4>Or using Certbot:</h4>
    <pre><code>./install_ssl_certbot.sh</code></pre>
    
    <h3>Step 17: Test RPC Endpoint</h3>
    <p>Test your RPC locally:</p>
    <pre><code>curl -X POST http://localhost/rpc \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  -H 'Content-Type: application/json'</code></pre>
    
    <p>Test from external source (if configured):</p>
    <pre><code>curl -X POST https://your-domain.com/rpc \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  -H 'Content-Type: application/json'</code></pre>
    
    <h2>Phase 5: Monitoring and Maintenance</h2>
    
    <h3>Essential Monitoring Commands</h3>
    <p>Create an alias for quick status checks:</p>
    <pre><code>echo 'alias nodestatus="sudo systemctl status eth1 cl validator mev"' >> ~/.bashrc
source ~/.bashrc</code></pre>
    
    <p>Now you can quickly check all services:</p>
    <pre><code>nodestatus</code></pre>
    
    <h3>Log Monitoring</h3>
    <p>View logs in real-time:</p>
    <pre><code># All logs together
sudo journalctl -f -u eth1 -u cl -u validator -u mev

# Individual service logs
sudo journalctl -fu eth1      # Execution client
sudo journalctl -fu cl        # Consensus client
sudo journalctl -fu validator # Validator
sudo journalctl -fu mev       # MEV-Boost</code></pre>
    
    <h3>Disk Space Management</h3>
    <p>Monitor disk usage:</p>
    <pre><code>df -h
du -sh /var/lib/goethereum  # Geth data
du -sh ~/prysm               # Prysm data</code></pre>
    
    <h3>Performance Monitoring</h3>
    <p>Check resource usage:</p>
    <pre><code>htop  # CPU and memory usage
iotop # Disk I/O monitoring
nethogs # Network usage by process</code></pre>
    
    <h2>Troubleshooting Common Issues</h2>
    
    <h3>Node Won't Sync</h3>
    <ol>
      <li><strong>Check peer connections:</strong>
        <pre><code>sudo geth attach http://localhost:8545
> net.peerCount</code></pre>
        <p>Should return > 0</p>
      </li>
      <li><strong>Verify firewall rules:</strong>
        <pre><code>sudo ufw status</code></pre>
      </li>
      <li><strong>Ensure time sync:</strong>
        <pre><code>timedatectl status</code></pre>
      </li>
    </ol>
    
    <h3>High Resource Usage</h3>
    <ol>
      <li><strong>Reduce cache if RAM limited:</strong>
        <p>Edit <code>exports.sh</code>, lower <code>GETH_CACHE</code></p>
      </li>
      <li><strong>Limit peer connections:</strong>
        <p>Reduce <code>MAX_PEERS</code> in <code>exports.sh</code></p>
      </li>
      <li><strong>Check for disk I/O bottleneck:</strong>
        <pre><code>iostat -x 1</code></pre>
      </li>
    </ol>
    
    <h3>Service Fails to Start</h3>
    <ol>
      <li><strong>Check service logs:</strong>
        <pre><code>sudo journalctl -xe -u SERVICE_NAME</code></pre>
      </li>
      <li><strong>Verify configuration files:</strong>
        <pre><code>ls -la ~/prysm/*.yaml
ls -la ~/secrets/jwt.hex</code></pre>
      </li>
      <li><strong>Ensure proper permissions:</strong>
        <pre><code>sudo chown -R eth:eth ~/prysm
sudo chown -R eth:eth ~/secrets</code></pre>
      </li>
    </ol>
    
    <h2>Security Best Practices</h2>
    
    <h3>Regular Updates</h3>
    <p>Keep your system and clients updated:</p>
    <pre><code>cd ~/eth2-quickstart
./update.sh</code></pre>
    
    <h3>Backup Critical Files</h3>
    <p>Always backup:</p>
    <ul>
      <li>Validator keys (store offline!)</li>
      <li><code>~/prysm/direct/accounts</code> (encrypted validator data)</li>
      <li><code>~/secrets/jwt.hex</code> (can regenerate if lost)</li>
      <li>Your configuration files</li>
    </ul>
    
    <h3>Monitor Security Logs</h3>
    <p>Check for suspicious activity:</p>
    <pre><code>sudo fail2ban-client status
sudo grep "Failed password" /var/log/auth.log
sudo last -10  # Recent logins</code></pre>
    
    <h3>Firewall Hardening</h3>
    <p>After everything works, consider:</p>
    <pre><code># Disable root SSH entirely
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd</code></pre>
    
    <h2>Next Steps</h2>
    <p>Congratulations! You now have a fully operational Ethereum node. Here's what to do next:</p>
    
    <ol>
      <li><strong>Monitor your node</strong> for 24-48 hours to ensure stability</li>
      <li><strong>Set up alerts</strong> for service failures (use monitoring tools like Grafana)</li>
      <li><strong>Join the community</strong> for support and updates</li>
      <li><strong>Consider redundancy</strong> - run a backup node if operating a validator</li>
      <li><strong>Document your setup</strong> - keep notes on any customizations</li>
    </ol>
    
    <h2>Useful Resources</h2>
    <ul>
      <li><strong>Check sync status</strong>: <a href="https://beaconcha.in" target="_blank">https://beaconcha.in</a></li>
      <li><strong>Validator monitoring</strong>: https://beaconcha.in/validator/YOUR_VALIDATOR_PUBKEY</li>
      <li><strong>Network statistics</strong>: <a href="https://etherscan.io/nodetracker" target="_blank">https://etherscan.io/nodetracker</a></li>
      <li><strong>Client documentation</strong>:
        <ul>
          <li>Geth: <a href="https://geth.ethereum.org/docs" target="_blank">https://geth.ethereum.org/docs</a></li>
          <li>Prysm: <a href="https://docs.prylabs.network" target="_blank">https://docs.prylabs.network</a></li>
          <li>MEV-Boost: <a href="https://boost.flashbots.net" target="_blank">https://boost.flashbots.net</a></li>
        </ul>
      </li>
    </ul>
    
    <h2>Conclusion</h2>
    <p>You've successfully transformed a bare server into a professional-grade Ethereum node. This setup provides:</p>
    
    <ul>
      <li><strong>Security</strong>: Hardened system with multiple protection layers</li>
      <li><strong>Performance</strong>: Optimized client configurations</li>
      <li><strong>Reliability</strong>: Systemd service management with auto-restart</li>
      <li><strong>Profitability</strong>: MEV-Boost integration for maximum rewards</li>
      <li><strong>Sovereignty</strong>: Complete control over your blockchain interaction</li>
    </ul>
    
    <p>Remember, running a node is an ongoing responsibility. Regular monitoring, updates, and maintenance ensure your node continues contributing to Ethereum's decentralization and security.</p>
    
    <p><em>This is part 2 of a 5-part series on eth2-quickstart. Next up: "Choosing the Right Clients: A Deep Dive into Ethereum Client Diversity"</em></p>
  `,
  author: 'SharedStake Team',
  publishDate: '2024-10-08',
  tags: ['ethereum', 'node', 'installation', 'tutorial', 'eth2-quickstart', 'validator'],
  featured: true,
  meta: {
    description: 'Complete step-by-step guide to installing an Ethereum node using eth2-quickstart, from server setup to running validator.',
    keywords: 'ethereum node installation, eth2-quickstart guide, node setup tutorial, validator setup, MEV-boost configuration'
  }
};