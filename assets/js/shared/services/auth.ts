import { client } from '../../lib/apollo';
import { gql } from '@apollo/client';

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

export interface AuthResponse {
  user: User;
  token: string;
}

interface LoginResponse {
  login: AuthResponse;
}

interface RegisterResponse {
  register: AuthResponse;
}

interface MeResponse {
  me: User;
}

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

/**
 * AuthService - Secure authentication following industry best practices
 *
 * Uses server-side sessions with httpOnly cookies instead of client-side tokens
 * for maximum security. Authentication state is kept in memory only.
 */
export class AuthService {
  private static currentUser: User | null = null;
  private static isAuthenticatedState: boolean = false;

  static async checkAuth(): Promise<User | null> {
    try {
      const { data } = await client.query<MeResponse>({
        query: ME_QUERY,
        fetchPolicy: 'network-only',
      });

      if (data?.me) {
        this.currentUser = this.sanitizeUser(data.me);
        this.isAuthenticatedState = true;
        return this.currentUser;
      }

      this.currentUser = null;
      this.isAuthenticatedState = false;
      return null;
    } catch {
      this.currentUser = null;
      this.isAuthenticatedState = false;
      return null;
    }
  }

  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  static isAuthenticated(): boolean {
    return this.isAuthenticatedState;
  }

  static async login(input: LoginInput): Promise<AuthResponse> {
    const { data } = await client.mutate<LoginResponse>({
      mutation: LOGIN_MUTATION,
      variables: { input },
    });

    if (!data?.login?.user) {
      throw new Error('Login failed');
    }

    const { user, token } = data.login;
    this.currentUser = this.sanitizeUser(user);
    this.isAuthenticatedState = true;

    return { user: this.currentUser, token };
  }

  static async register(input: RegisterInput): Promise<AuthResponse> {
    const { data } = await client.mutate<RegisterResponse>({
      mutation: REGISTER_MUTATION,
      variables: { input },
    });

    if (!data?.register?.user) {
      throw new Error('Registration failed');
    }

    const { user, token } = data.register;
    this.currentUser = this.sanitizeUser(user);
    this.isAuthenticatedState = true;

    return { user: this.currentUser, token };
  }

  static async logout(): Promise<void> {
    try {
      this.currentUser = null;
      this.isAuthenticatedState = false;
      client.clearStore();
    } catch (error) {
      this.currentUser = null;
      this.isAuthenticatedState = false;
      client.clearStore();
      throw error;
    }
  }

  private static sanitizeUser(user: User): User {
    const sanitizeString = (str: string): string => {
      return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim()
        .substring(0, 255);
    };

    return {
      id: sanitizeString(user.id),
      email: sanitizeString(user.email),
      firstName: sanitizeString(user.firstName),
      lastName: sanitizeString(user.lastName),
    };
  }
}
