# Validator Status Checker

This script checks if the 500 validator indices from git history are still active validators on the Ethereum beacon chain.

## Prerequisites

- **Bun** runtime (version >= 1.0.0) - the project uses Bun
- Internet connection to access beaconcha.in API

## Usage

### Basic Usage

```bash
bun check-validator-status.js
```

This will:
- Read validator indices from `validator_indices_500.txt`
- Check each validator's status via beaconcha.in API
- Display a summary of active/inactive/slashed validators
- Save results to `validator-status-results.json`

### Options

```bash
# Use a different indices file
bun check-validator-status.js --file path/to/indices.txt

# Adjust rate limiting delay (default: 7000ms = ~8.5 calls/min)
bun check-validator-status.js --delay 5000

# Change chunk size (default: 100, max supported by API)
bun check-validator-status.js --chunk-size 50

# Show help
bun check-validator-status.js --help
```

## How It Works

1. **Reads validator indices** from the specified file (default: `validator_indices_500.txt`)
2. **Chunks indices** into groups of 100 (API limit)
3. **Makes API calls** to `https://beaconcha.in/api/v1/validator/` with rate limiting
4. **Categorizes validators** into:
   - `active_online` - Active and online
   - `active_offline` - Active but offline
   - `exited` - Exited from the validator set
   - `slashed` - Slashed validators
   - `pending` - Pending activation
   - `unknown` - Unknown status
   - `not_found` - Not found in API response

5. **Generates report** with:
   - Summary statistics
   - Detailed breakdowns
   - Balance statistics
   - JSON export file

## Rate Limiting

The script includes built-in rate limiting:
- Default delay: 7000ms between API calls (~8.5 calls/min)
- Beaconcha.in free tier limit: 10 calls/min
- Adjust with `--delay` flag if needed

## Output

### Console Output

The script displays:
- Progress during execution
- Summary statistics
- Lists of slashed/exited/not found validators
- Balance statistics

### JSON Export

Results are saved to `validator-status-results.json` with:
- Timestamp
- Summary counts
- Lists of indices by category

Example output structure:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "total_checked": 500,
  "summary": {
    "active_online": 450,
    "active_offline": 10,
    "exited": 30,
    "slashed": 5,
    "pending": 0,
    "unknown": 0,
    "not_found": 5
  },
  "results": {
    "active_online": ["91086", "99502", ...],
    "active_offline": [...],
    "exited": [...],
    "slashed": [...],
    "pending": [...],
    "unknown": [...],
    "not_found": [...]
  }
}
```

## Example Run

```bash
$ bun check-validator-status.js

🔍 Checking validator status...

📁 Reading indices from: /workspace/validator_indices_500.txt
📊 Found 500 validator indices

📦 Split into 5 chunks of up to 100 indices each
⏱️  Using 7000ms delay between API calls

[1/5] Fetching 100 validators...
  ✅ Retrieved 100 validator records
  ⏳ Waiting 7000ms before next request...

...

============================================================
📊 VALIDATOR STATUS SUMMARY
============================================================
✅ Active Online:     450
⚠️  Active Offline:    10
🚪 Exited:            30
🔨 Slashed:           5
⏳ Pending:           0
❓ Unknown Status:    0
❌ Not Found:         5
============================================================
📈 Total Checked:     500
✅ Total Active:      460
============================================================

💾 Results saved to: validator-status-results.json

✨ Check complete!
```

## Notes

- The script respects API rate limits to avoid being blocked
- Processing 500 validators takes approximately 35-40 seconds (5 chunks × 7 seconds)
- Validator indices are from commit `06b207a` (Sep 23, 2021)
- Some validators may have exited or been slashed since then

## Troubleshooting

**API errors**: If you see API errors, try increasing the delay:
```bash
bun check-validator-status.js --delay 10000
```

**Not found validators**: Some validators may not be found if:
- They were never activated
- They've been completely withdrawn
- API data is incomplete

**Rate limiting**: If you hit rate limits, increase the delay between calls.
