#!/bin/bash
cd /workspace
npm run build 2>&1
echo "Build exit code: $?"