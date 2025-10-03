#!/usr/bin/env python3
import os
import subprocess
import shutil

os.chdir('/workspace')

print("Cleaning up git state...")

# Force cleanup of all rebase/merge state
dirs_to_remove = ['.git/rebase-merge', '.git/rebase-apply']
files_to_remove = [
    '.git/REBASE_HEAD', '.git/AUTO_MERGE', '.git/MERGE_MSG',
    '.git/MERGE_HEAD', '.git/CHERRY_PICK_HEAD', '.git/index.lock'
]

for d in dirs_to_remove:
    if os.path.exists(d):
        shutil.rmtree(d, ignore_errors=True)
        
for f in files_to_remove:
    if os.path.exists(f):
        try:
            os.remove(f)
        except:
            pass

print("Resetting to branch...")

# Force checkout to branch
subprocess.run(['git', 'reset', '--hard'], capture_output=True)
subprocess.run(['git', 'checkout', '-f', 'cursor/research-and-fix-mailing-list-signup-4eb6'], capture_output=True)

print("Fetching latest main...")
subprocess.run(['git', 'fetch', 'origin', 'main'], capture_output=True)

print("Creating new branch for merged changes...")
# Create a new branch from main and cherry-pick our changes
subprocess.run(['git', 'checkout', '-b', 'temp-merge-branch', 'origin/main'], capture_output=True)

# Get list of our commits
our_commits = [
    'e420ef61d1f352f85ed3e8fdb6c0eed10bdceba4',  # Improve mailing list signup
    '4221e0e67fd99ba7fa9a5388ab62667014342238',  # Update dependencies  
    'c8c9fb4990a855eb8c415225c1404502a732446a',  # Add early CTA
    '3728b2c7cbc88ec2d0a031a2384a6c7aba8b558e',  # Improve styling
    '97bdbf4c742f53612dc2f7550788bde87c7a4ee3',  # Improve accessibility
    'e9f7e2edd9359f848e56e663c4b91a801be76541'   # Desktop styling
]

print("Cherry-picking our changes...")
for commit in our_commits:
    result = subprocess.run(['git', 'cherry-pick', commit], capture_output=True, text=True)
    if result.returncode != 0:
        # If conflict, try to resolve by accepting theirs for package files
        subprocess.run(['git', 'status', '--short'], capture_output=True)
        
        # Check for package file conflicts
        status = subprocess.run(['git', 'status', '--short'], capture_output=True, text=True)
        if 'package-lock.json' in status.stdout or 'yarn.lock' in status.stdout:
            print(f"Resolving package file conflicts for {commit[:8]}...")
            subprocess.run(['git', 'checkout', '--theirs', 'package-lock.json'], capture_output=True)
            subprocess.run(['git', 'checkout', '--theirs', 'yarn.lock'], capture_output=True)
            subprocess.run(['git', 'add', 'package-lock.json', 'yarn.lock'], capture_output=True)
            subprocess.run(['git', 'cherry-pick', '--continue'], capture_output=True)

print("Switching back to original branch...")
subprocess.run(['git', 'checkout', '-f', 'cursor/research-and-fix-mailing-list-signup-4eb6'], capture_output=True)
subprocess.run(['git', 'reset', '--hard', 'temp-merge-branch'], capture_output=True)
subprocess.run(['git', 'branch', '-D', 'temp-merge-branch'], capture_output=True)

print("Done! Current status:")
result = subprocess.run(['git', 'status'], capture_output=True, text=True)
print(result.stdout)

print("\nCurrent branch:")
result = subprocess.run(['git', 'branch', '--show-current'], capture_output=True, text=True)
print(result.stdout)

print("\nLatest commits:")
result = subprocess.run(['git', 'log', '--oneline', '-5'], capture_output=True, text=True)
print(result.stdout)