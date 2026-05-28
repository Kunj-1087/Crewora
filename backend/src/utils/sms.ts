import { logger } from './logger';

/**
 * Mock SMS Service for mobile number OTP verification.
 * Logs verification codes to the backend console.
 */
export async function sendOtpSms(phone: string, code: string): Promise<void> {
  logger.info(`[SMS MOCK] Send OTP - Phone: ${phone}, Code: ${code}`);
}
