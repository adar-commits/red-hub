/**
 * OTP utilities. State is now stored in the encrypted `red_hub_otp` cookie
 * (see session.ts / getOtpSession) instead of in-memory.
 */

function randomDigits(len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  return s;
}

export function generateOtp(): string {
  return randomDigits(5);
}
