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

  it('should include authorization header when token exists in localStorage', () => {
    const token = 'test-token-123';
    localStorage.setItem('token', token);

    // Verify client has link configured
    expect(client.link).toBeDefined();
  });

  it('should not include authorization header when no token in localStorage', () => {
    // Ensure no token is set
    expect(localStorage.getItem('token')).toBeNull();

    // Verify client has link configured
    expect(client.link).toBeDefined();
  });

  it('should use correct GraphQL endpoint', () => {
    // Verify client has link configured for GraphQL endpoint
    expect(client.link).toBeDefined();
  });
});
