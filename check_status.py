#!/usr/bin/env python3
import subprocess
import os
import sys

os.chdir('/workspace')

# Clean up git state
cleanup_files = [
    '.git/REBASE_HEAD',
    '.git/AUTO_MERGE', 
    '.git/MERGE_MSG',
    '.git/index.lock'
]

for f in cleanup_files:
    if os.path.exists(f):
        try:
            os.remove(f)
            print(f"Removed {f}")
        except:
            pass

# Clean up directories
cleanup_dirs = [
    '.git/rebase-merge',
    '.git/rebase-apply'
]

for d in cleanup_dirs:
    if os.path.exists(d):
        try:
            import shutil
            shutil.rmtree(d)
            print(f"Removed {d}")
        except:
            pass

# Reset to branch
try:
    result = subprocess.run(['git', 'checkout', 'cursor/research-and-fix-mailing-list-signup-4eb6'], 
                          capture_output=True, text=True, timeout=2)
    print("Checkout result:", result.stdout, result.stderr)
except subprocess.TimeoutExpired:
    print("Checkout timed out")
except Exception as e:
    print(f"Error: {e}")

# Check status
try:
    result = subprocess.run(['git', 'status', '--short'], 
                          capture_output=True, text=True, timeout=2)
    print("Status:", result.stdout)
except subprocess.TimeoutExpired:
    print("Status check timed out")
except Exception as e:
    print(f"Error: {e}")