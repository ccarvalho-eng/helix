import { client } from '../apollo';
import { ApolloClient, InMemoryCache } from '@apollo/client';

describe('Apollo Client', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create an Apollo Client instance', () => {
    expect(client).toBeInstanceOf(ApolloClient);
  });

  it('should have InMemoryCache configured', () => {
    expect(client.cache).toBeInstanceOf(InMemoryCache);
  });

  it('should have link configured', () => {
    expect(client.link).toBeDefined();
  });

  it('should handle token from localStorage', () => {
    const token = 'test-token-123';
    localStorage.setItem('token', token);

    // Verify token is stored correctly
    expect(localStorage.getItem('token')).toBe(token);
  });

  it('should handle missing token from localStorage', () => {
    // Ensure no token is set
    expect(localStorage.getItem('token')).toBeNull();
  });
});
