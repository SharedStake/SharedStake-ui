# BigInt Type Mixing Fixes

## 🎯 Issue Resolved
Fixed BigInt type mixing errors in earn page components after Web3.js → ethers.js migration.

## 📁 Files Modified
- `src/components/Earn/geyser.vue`
- `src/components/Earn/geyserV2.vue`
- `src/components/Earn/Earn.vue`
- `src/components/Landing/Landing.vue`
- `src/components/Withdraw/WithdrawalsFAQ.vue`

## 🔧 Key Fixes

### Template BigInt Mixing (Critical)
**Problem**: `10 ** decimals` and `10 ** 18` used directly with BN objects in Vue templates.

**Solution**: Added computed properties for template access:
```javascript
computed: {
  decimalsPower: function() {
    return BN(10).pow(this.decimals);
  },
  eighteenPower: function() {
    return BN(10).pow(18);
  },
}
```

### Time Calculations
**Before**: `BN((Number(until) - now) / 60 / 60 / 24)`
**After**: `BN(Number(until) - now).div(60).div(60).div(24)`

### Pool Calculations
**Before**: `Number(totalSupply) / (Number(sgtOnUniswapLP) * 2)`
**After**: `BN(totalSupply.toString()).div(BN(sgtOnUniswapLP.toString()).multipliedBy(2)).toNumber()`

## ✅ Results
- ✅ All BigInt type mixing issues resolved
- ✅ Build successful with no errors
- ✅ Runtime stability improved
- ✅ 5 components fixed across earn, landing, and withdraw pages