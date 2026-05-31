# SharedStake Keeper systemd Units

This directory contains production service units for all four keepers:

- `sharedstake-keeper-deposit-sweep.service`
- `sharedstake-keeper-oracle-reporter.service`
- `sharedstake-keeper-withdrawal-finalizer.service`
- `sharedstake-keeper-balance-monitor.service`

## Prerequisites

1. Host has Node.js 20+ and npm installed.
2. Repo is checked out at `/opt/sharedstake/SharedDeposit`.
3. Dependencies are installed:
   - `cd /opt/sharedstake/SharedDeposit && yarn install --frozen-lockfile`
4. Service user exists:
   - `sudo useradd -r -m -d /opt/sharedstake sharedstake` (if missing)
5. Runtime env file exists at `/etc/sharedstake/keeper.env`.

Use `.env.keeper.example` as the source template.

## Install

```bash
cd SharedDeposit
sudo bash ops/systemd/install-keepers.sh
```

## Start / Verify

```bash
sudo systemctl start \
  sharedstake-keeper-deposit-sweep.service \
  sharedstake-keeper-oracle-reporter.service \
  sharedstake-keeper-withdrawal-finalizer.service \
  sharedstake-keeper-balance-monitor.service

sudo systemctl status sharedstake-keeper-deposit-sweep.service --no-pager
sudo journalctl -u sharedstake-keeper-balance-monitor.service -f
```
