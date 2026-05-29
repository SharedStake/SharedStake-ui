import { getAddress } from "ethers";

export class InputValidationError extends Error {
  readonly status = 400;
  readonly errorCode = "validation_error";

  constructor(message: string) {
    super(message);
    this.name = "InputValidationError";
  }
}

const CODE_REGEX = /^[A-Z0-9][A-Z0-9_-]{3,23}$/;

export function normalizeCode(input: string): string {
  const normalized = input.trim().toUpperCase().replace(/\s+/g, "");
  if (!CODE_REGEX.test(normalized)) {
    throw new InputValidationError(
      "Invalid code format. Use 4-24 chars: A-Z, 0-9, '_' or '-', starting with A-Z/0-9."
    );
  }
  return normalized;
}

export function normalizeAddress(input: string): string {
  try {
    return getAddress(input.trim());
  } catch {
    throw new InputValidationError("Invalid EVM address.");
  }
}
