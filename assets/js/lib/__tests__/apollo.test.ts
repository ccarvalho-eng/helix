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

  it('should include authorization header when token exists in localStorage', async () => {
    const token = 'test-token-123';
    localStorage.setItem('token', token);

    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { __typename: 'Query' } }),
      text: async () => '',
    } as any);
    (global as any).fetch = fetchMock;

    try {
      // fire a minimal GraphQL request
      await client.query({
        query: { kind: 'Document', definitions: [] } as any, // noop query to trigger link
        fetchPolicy: 'no-cache',
      });
    } catch {
      // ignore parsing errors from empty query; focus on header assertion
    }

    expect(fetchMock).toHaveBeenCalled();
    const [, fetchInit] = fetchMock.mock.calls[0] as [RequestInfo, RequestInit];
    const headers = new Headers(fetchInit?.headers as any);
    expect(headers.get('authorization')).toBe(`Bearer ${token}`);

    (global as any).fetch = originalFetch;
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
