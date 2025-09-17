const { gql } = require('@apollo/client');

// Mock GraphQL queries and mutations for testing
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

module.exports = {
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  ME_QUERY,
};
