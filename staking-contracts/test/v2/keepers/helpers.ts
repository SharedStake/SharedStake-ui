/**
 * Shared test helpers for the keeper unit tests.
 *
 * The keepers under test fall into two categories:
 *
 *   1. Functions that accept an `ethers.Contract` directly (verifyGuardianRole,
 *      checkOnce, triggerPause). These are trivially testable with a plain
 *      fake-contract object — see `makeFakeContract`.
 *
 *   2. Functions that construct their own `ethers.JsonRpcProvider`,
 *      `ethers.Wallet` and `ethers.Contract` internally (finalizeOnce,
 *      sweepOnce, reportOnce). To test these without a live RPC we patch the
 *      relevant constructors on the shared `ethers` module object — the keeper
 *      and the test import the *same* module singleton, so the patch is
 *      visible inside the keeper. `patchEthers` saves the original property
 *      descriptors and returns a restore function for use in `afterEach`.
 *
 * No external mocking library is used (sinon / chai-spies are not project
 * dependencies). Manual fakes keep the dependency surface at zero.
 */
import {ethers} from "ethers";

/** A method recorder: tracks call arguments so tests can assert on them. */
export interface RecordedCall {
  calls: unknown[][];
}

/**
 * Build a fake ethers.Contract-like object. `methods` maps method names to
 * implementations (sync values or async functions). Every invocation is
 * recorded on `<contract>.__calls[name]`.
 */
export function makeFakeContract(
  methods: Record<string, unknown>,
  address = "0x000000000000000000000000000000000000dEaD",
): any {
  const calls: Record<string, unknown[][]> = {};
  const contract: any = {
    __calls: calls,
    getAddress: async () => address,
  };
  for (const [name, impl] of Object.entries(methods)) {
    calls[name] = [];
    contract[name] = (...args: unknown[]) => {
      calls[name].push(args);
      if (typeof impl === "function") {
        return (impl as (...a: unknown[]) => unknown)(...args);
      }
      return impl;
    };
  }
  return contract;
}

/** Restore-handle returned by `patchEthers`. */
export type RestoreFn = () => void;

/**
 * Patch constructors / functions on the shared `ethers` module object. Returns
 * a function that restores the originals. Must be paired in afterEach.
 */
export function patchEthers(overrides: Record<string, unknown>): RestoreFn {
  const target = ethers as unknown as Record<string, unknown>;
  const saved: Array<[string, PropertyDescriptor | undefined]> = [];
  for (const [key, value] of Object.entries(overrides)) {
    saved.push([key, Object.getOwnPropertyDescriptor(target, key)]);
    Object.defineProperty(target, key, {
      value,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
  return () => {
    for (const [key, desc] of saved) {
      if (desc) {
        Object.defineProperty(target, key, desc);
      } else {
        delete target[key];
      }
    }
  };
}

/** A fake JsonRpcProvider with configurable balance and latest-block timestamp. */
export function makeFakeProvider(
  balanceWei: bigint = 0n,
  latestBlockTimestamp: number = Math.floor(Date.now() / 1000),
): any {
  return {
    getBalance: async () => balanceWei,
    getBlock: async () => ({timestamp: latestBlockTimestamp}),
  };
}

/** A fake Wallet exposing only the `address` field the keepers read. */
export function makeFakeWallet(address = "0x00000000000000000000000000000000000000A1"): any {
  return {address};
}

/**
 * A fake transaction object compatible with `await tx.wait()`. Records nothing
 * itself; the recording happens on the contract method that returns it.
 */
export function makeFakeTx(hash = "0xtxhash"): any {
  return {
    hash,
    wait: async () => ({blockNumber: 123, gasUsed: 21000n}),
  };
}
