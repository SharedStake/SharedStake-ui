const REFERRAL_CODE_REGEX = /^[A-Z0-9][A-Z0-9_-]{3,23}$/

export function normalizeReferralCode(rawCode) {
  if (rawCode == null) return ''
  return String(rawCode).toUpperCase().replace(/\s+/g, '')
}

export function isValidReferralCode(code) {
  return REFERRAL_CODE_REGEX.test(code)
}
