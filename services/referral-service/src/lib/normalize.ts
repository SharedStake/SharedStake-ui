import { getAddress } from "ethers";

const CODE_REGEX = /^[A-Z0-9][A-Z0-9_-]{3,23}$/;

export function normalizeCode(input: string): string {
  const normalized = input.trim().toUpperCase().replace(/\s+/g, "");
  if (!CODE_REGEX.test(normalized)) {
    throw new Error(
      "Invalid code format. Use 4-24 chars: A-Z, 0-9, '_' or '-', starting with A-Z/0-9."
    );
  }
  return normalized;
}

export function normalizeAddress(input: string): string {
  try {
    return getAddress(input.trim());
  } catch {
    throw new Error("Invalid EVM address.");
  }
}
