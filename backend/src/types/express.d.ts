/**
 * Express Request augmentation — adds authenticated user info to req object
 */

import { TokenUserType } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        type: TokenUserType;
      };
    }
  }
}

export {};
