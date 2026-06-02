/**
 * In-Memory Token Store
 * Access tokens stored in memory ONLY — never in localStorage or sessionStorage.
 * This prevents XSS-based token theft.
 * Refresh tokens are stored in HttpOnly cookies (server-side).
 */

export type UserType = 'customer' | 'worker' | 'admin' | null;

class TokenStore {
  private accessToken: string | null = null;
  private userType: UserType = null;

  setToken(token: string, type?: UserType): void {
    this.accessToken = token;
    if (type) this.userType = type;
  }

  getToken(): string | null {
    return this.accessToken;
  }

  getUserType(): UserType {
    return this.userType;
  }

  setUserType(type: UserType): void {
    this.userType = type;
  }

  clearToken(): void {
    this.accessToken = null;
    this.userType = null;
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }
}

// Singleton
export const tokenStore = new TokenStore();
