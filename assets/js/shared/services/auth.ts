import { client } from '../../lib/apollo';
import { gql } from '@apollo/client';

// Define our types locally to avoid generated types issues
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface LoginResponse {
  login: {
    user: User;
    token: string;
  };
}

interface RegisterResponse {
  register: {
    user: User;
    token: string;
  };
}

interface MeResponse {
  me: User;
}

// GraphQL documents
const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        email
        firstName
        lastName
      }
      token
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        email
        firstName
        lastName
      }
      token
    }
  }
`;

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      firstName
      lastName
    }
  }
`;

export interface AuthResponse {
  user: User;
  token: string;
}

export class AuthService {
  private static readonly TOKEN_KEY = 'helix_auth_token';
  private static readonly USER_KEY = 'helix_user_data';
  private static readonly TOKEN_EXPIRY_KEY = 'helix_token_expiry';

  // Secure token management with XSS protection
  static getToken(): string | null {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);

      if (!token || !expiry) {
        return null;
      }

      // Check if token has expired
      if (Date.now() > parseInt(expiry)) {
        this.logout();
        return null;
      }

      return token;
    } catch (error) {
      console.error('Error accessing token:', error);
      return null;
    }
  }

  static setToken(token: string): void {
    try {
      // Set token expiry for 24 hours (adjust as needed)
      const expiry = Date.now() + 24 * 60 * 60 * 1000;

      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiry.toString());
    } catch (error) {
      console.error('Error storing token:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  static removeToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  static getStoredUser(): User | null {
    try {
      const userJson = localStorage.getItem(this.USER_KEY);
      if (!userJson) return null;

      const user = JSON.parse(userJson);

      // Sanitize user data to prevent XSS
      return this.sanitizeUser(user);
    } catch (error) {
      console.error('Error accessing user data:', error);
      return null;
    }
  }

  static setStoredUser(user: User): void {
    try {
      const sanitizedUser = this.sanitizeUser(user);
      localStorage.setItem(this.USER_KEY, JSON.stringify(sanitizedUser));
    } catch (error) {
      console.error('Error storing user data:', error);
      throw new Error('Failed to store user data');
    }
  }

  static removeStoredUser(): void {
    try {
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error('Error removing user data:', error);
    }
  }

  // Sanitize user data to prevent XSS attacks
  private static sanitizeUser(user: User): User {
    const sanitizeString = (str: string): string => {
      if (typeof str !== 'string') return '';
      return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim()
        .substring(0, 255); // Limit length
    };

    return {
      id: sanitizeString(user.id as string),
      email: sanitizeString(user.email as string),
      firstName: sanitizeString(user.firstName as string),
      lastName: sanitizeString(user.lastName as string),
    };
  }

  static async login(input: LoginInput): Promise<AuthResponse> {
    try {
      const { data } = await client.mutate<LoginResponse>({
        mutation: LOGIN_MUTATION,
        variables: { input },
      });

      if (!data || !data.login || !data.login.user || !data.login.token) {
        throw new Error('Invalid response from server');
      }

      const { user, token } = data.login;

      this.setToken(token);
      this.setStoredUser(user);

      return { user, token };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  }

  static async register(input: RegisterInput): Promise<AuthResponse> {
    try {
      const { data } = await client.mutate<RegisterResponse>({
        mutation: REGISTER_MUTATION,
        variables: { input },
      });

      if (!data || !data.register || !data.register.user || !data.register.token) {
        throw new Error('Invalid response from server');
      }

      const { user, token } = data.register;

      this.setToken(token);
      this.setStoredUser(user);

      return { user, token };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const { data } = await client.query<MeResponse>({
        query: ME_QUERY,
        fetchPolicy: 'cache-first',
      });

      if (data && data.me) {
        this.setStoredUser(data.me);
        return data.me;
      }

      return null;
    } catch {
      this.logout();
      return null;
    }
  }

  static logout(): void {
    try {
      // Clear all authentication data
      this.removeToken();
      this.removeStoredUser();

      // Clear Apollo cache to remove any cached user data
      client.clearStore();

      // Clear any other sensitive data that might be cached
      sessionStorage.clear();
    } catch (error) {
      console.error('Error during logout:', error);
      // Force cleanup even if error occurs
      try {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
      } catch (cleanupError) {
        console.error('Error during forced cleanup:', cleanupError);
      }
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
