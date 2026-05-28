/**
 * Ownership assertion utility.
 * Always returns 404 (not 403) on ownership mismatch to prevent enumeration.
 * Per PRD security requirement: assertOwnership() in every controller.
 */

import { AppError } from './AppError';

export function assertOwnership(resourceOwnerId: string, requestingUserId: string): void {
  if (resourceOwnerId.toString() !== requestingUserId.toString()) {
    // Return 404 intentionally — never reveal that the resource exists for another user
    throw new AppError('Resource not found', 404);
  }
}
