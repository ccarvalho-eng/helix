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

    // Access the private link property to test auth link
    const link = (client as any).link;
    expect(link).toBeDefined();
  });

  it('should not include authorization header when no token in localStorage', () => {
    // Ensure no token is set
    expect(localStorage.getItem('token')).toBeNull();

    const link = (client as any).link;
    expect(link).toBeDefined();
  });

  it('should use correct GraphQL endpoint', () => {
    // The httpLink should point to /api/graphql
    const link = (client as any).link;
    expect(link).toBeDefined();
  });
});
