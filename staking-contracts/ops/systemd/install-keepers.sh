#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYSTEMD_DIR="${SYSTEMD_DIR:-/etc/systemd/system}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root (or via sudo)." >&2
  exit 1
fi

install -m 0644 "${SCRIPT_DIR}/sharedstake-keeper-deposit-sweep.service" "${SYSTEMD_DIR}/sharedstake-keeper-deposit-sweep.service"
install -m 0644 "${SCRIPT_DIR}/sharedstake-keeper-oracle-reporter.service" "${SYSTEMD_DIR}/sharedstake-keeper-oracle-reporter.service"
install -m 0644 "${SCRIPT_DIR}/sharedstake-keeper-withdrawal-finalizer.service" "${SYSTEMD_DIR}/sharedstake-keeper-withdrawal-finalizer.service"
install -m 0644 "${SCRIPT_DIR}/sharedstake-keeper-balance-monitor.service" "${SYSTEMD_DIR}/sharedstake-keeper-balance-monitor.service"

systemctl daemon-reload
systemctl enable sharedstake-keeper-deposit-sweep.service
systemctl enable sharedstake-keeper-oracle-reporter.service
systemctl enable sharedstake-keeper-withdrawal-finalizer.service
systemctl enable sharedstake-keeper-balance-monitor.service

echo "Installed and enabled SharedStake keeper services."
echo "Start them with:"
echo "  systemctl start sharedstake-keeper-deposit-sweep.service sharedstake-keeper-oracle-reporter.service sharedstake-keeper-withdrawal-finalizer.service sharedstake-keeper-balance-monitor.service"
