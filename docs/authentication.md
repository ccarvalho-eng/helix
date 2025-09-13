# Helix Authentication System

This document describes the GraphQL-based authentication system implemented in Helix using Guardian and Argon2.

## Overview

The authentication system provides:

- User registration and login via GraphQL mutations
- JWT token-based authentication
- Password hashing with Argon2
- Protected GraphQL queries and mutations
- Session management through JWT tokens

## GraphQL API

### Mutations

#### Register a new user

```graphql
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
```

**Variables:**

```json
{
  "input": {
    "email": "user@example.com",
    "password": "securePassword123A",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### Login

```graphql
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
```

**Variables:**

```json
{
  "input": {
    "email": "user@example.com",
    "password": "securePassword123A"
  }
}
```

#### Update Profile (requires authentication)

```graphql
mutation UpdateProfile($input: UpdateUserInput!) {
  updateProfile(input: $input) {
    id
    email
    firstName
    lastName
  }
}
```

#### Change Password (requires authentication)

```graphql
mutation ChangePassword($input: ChangePasswordInput!) {
  changePassword(input: $input) {
    id
    email
  }
}
```

### Queries

#### Get current user (requires authentication)

```graphql
query Me {
  me {
    id
    email
    firstName
    lastName
  }
}
```

#### Get user by ID (requires authentication)

```graphql
query User($id: ID!) {
  user(id: $id) {
    id
    email
    firstName
    lastName
  }
}
```

#### List all users (requires authentication)

```graphql
query Users {
  users {
    id
    email
    firstName
    lastName
  }
}
```

## Authentication Headers

For protected queries and mutations, include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Password Requirements

Passwords must meet the following criteria:

- At least 8 characters long
- Contain at least one lowercase letter
- Contain at least one uppercase letter
- Contain at least one number

## Development

### GraphiQL Interface

In development mode, you can access the GraphiQL interface at:

```
http://localhost:4000/api/graphiql
```

### Testing

Run authentication tests:

```bash
mix test test/helix/accounts_test.exs
mix test test/helix_web/schema/
```

### Environment Variables

Set the following environment variable for JWT signing:

```bash
export GUARDIAN_SECRET_KEY="your-secret-key-here"
```

## Security Features

- Passwords are hashed using Argon2 (industry standard)
- JWT tokens are signed and verified
- Protection against timing attacks in user lookup
- Email uniqueness enforcement
- Input validation and sanitization

## Database Schema

The `users` table contains:

- `id` - UUID primary key
- `email` - Unique email address
- `password_hash` - Argon2 hashed password
- `first_name` - User's first name
- `last_name` - User's last name
- `inserted_at` - Creation timestamp
- `updated_at` - Last update timestamp
