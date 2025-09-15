import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

const httpLink = createHttpLink({
  uri: '/api/graphql',
  credentials: 'same-origin', // Include cookies for CSRF protection
});

const authLink = setContext((_, { headers }) => {
  // Use dynamic import to avoid circular dependency
  let token: string | null = null;
  try {
    token = localStorage.getItem('helix_auth_token');
    const expiry = localStorage.getItem('helix_token_expiry');

    // Check if token has expired
    if (token && expiry && Date.now() > parseInt(expiry)) {
      localStorage.removeItem('helix_auth_token');
      localStorage.removeItem('helix_token_expiry');
      localStorage.removeItem('helix_user_data');
      token = null;
    }
  } catch (error) {
    console.error('Error accessing token:', error);
    token = null;
  }

  return {
    headers: {
      ...headers,
      ...(token && { authorization: `Bearer ${token}` }),
      // Add CSRF protection header
      'X-Requested-With': 'XMLHttpRequest',
    },
  };
});

// Error handling link for auth errors
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);

      // Handle authentication errors
      if (message.includes('Unauthenticated') || message.includes('Not authenticated')) {
        // Clear auth data and redirect to login
        try {
          localStorage.removeItem('helix_auth_token');
          localStorage.removeItem('helix_token_expiry');
          localStorage.removeItem('helix_user_data');
          sessionStorage.clear();
        } catch (error) {
          console.error('Error clearing auth data:', error);
        }

        // Redirect to login page
        window.location.href = '/login';
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);

    // Handle 401 Unauthorized
    if (networkError.statusCode === 401) {
      try {
        localStorage.removeItem('helix_auth_token');
        localStorage.removeItem('helix_token_expiry');
        localStorage.removeItem('helix_user_data');
        sessionStorage.clear();
      } catch (error) {
        console.error('Error clearing auth data:', error);
      }

      window.location.href = '/login';
    }
  }
});

export const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    // Secure cache configuration
    typePolicies: {
      // Don't cache sensitive user data
      User: {
        fields: {
          email: {
            merge: false,
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});
