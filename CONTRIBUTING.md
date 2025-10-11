# Contributing to Helix

Thank you for your interest in contributing to Helix! This guide will help you get started with contributing to our project.

## Getting Started

### Prerequisites

- Elixir 1.17+
- Erlang/OTP 27+
- Node.js 18+
- PostgreSQL 17+
- Git

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/helix.git
   cd helix
   ```

2. **Install dependencies**
   ```bash
   # Install Elixir dependencies
   mix deps.get
   
   # Install Node.js dependencies
   npm ci
   ```

3. **Set up the database**
   ```bash
   mix ecto.setup
   ```

4. **Start the development server**
   ```bash
   mix phx.server
   ```

## Development Workflow

### Code Standards

- **Format code**: Run `mix format` for Elixir and `npm run prettier` for JS/TS
- **Dependencies**: Run `mix deps.get` after dependency changes
- **GraphQL types**: Run `npm run codegen` after schema changes
- **Documentation**: Generate docs with `mix docs` for public APIs

### Testing

- **Run all tests**: `mix test`
- **Run with coverage**: `mix test --cover`
- **Frontend tests**: `npm test`
- **Static analysis**: `mix credo` and `mix dialyzer`

### Pre-Commit Checklist

- [ ] Code formatted (`mix format`, `npm run prettier`)
- [ ] Dependencies updated (`mix deps.get` if needed)
- [ ] No compiler warnings from changes
- [ ] All tests pass (`mix test`, `npm test`)
- [ ] Dialyzer and Credo pass
- [ ] No security issues

## Pull Request Process

### Before Submitting

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our code standards

3. **Test thoroughly**
   - Write tests for new functionality
   - Ensure existing tests pass
   - Verify no regressions

4. **Commit with conventional format**
   ```bash
   git commit -m "feat(scope): add new feature"
   ```

### Commit Message Format

Use conventional commits: `<type>[scope]: <description>`

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:
```
feat(auth): add OAuth2 support
fix(api): handle 404 errors
docs(readme): update installation steps
refactor!: simplify response mapping
```

**Breaking changes**: Add `!` after type or `BREAKING CHANGE:` in footer

### Pull Request Guidelines

1. **Fill out the PR template** completely
2. **Link related issues** using `Fixes #123` or `Closes #123`
3. **Add screenshots** for UI changes
4. **Update documentation** if needed
5. **Keep PRs focused** - one feature/fix per PR

### Review Process

- All PRs require at least one review
- CI checks must pass
- Address feedback promptly
- Maintain clean commit history

## Code Style Guidelines

### Elixir

- Follow standard Elixir conventions
- Use `mix format` for consistent formatting
- Write descriptive function and variable names
- Add typespecs for public functions
- Write comprehensive tests

### JavaScript/TypeScript

- Use `npm run prettier` for formatting
- Follow existing patterns and conventions
- Write unit tests for new components
- Use TypeScript for type safety

### General

- Write clear, self-documenting code
- Add comments for complex logic
- Follow security best practices
- No secrets or credentials in code

## Reporting Issues

### Bug Reports

Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, versions)
- Screenshots if applicable

### Feature Requests

Include:
- Clear description of the feature
- Use case and motivation
- Proposed implementation (optional)
- Consider breaking changes

## Community Guidelines

- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Follow our Code of Conduct

## Getting Help

- Check existing issues and discussions
- Ask questions in issue comments
- Review documentation and README
- Reach out to maintainers if needed

## Development Resources

- [Elixir Documentation](https://elixir-lang.org/docs.html)
- [Phoenix Framework](https://phoenixframework.org/)
- [LiveView Guide](https://hexdocs.pm/phoenix_live_view/)
- [Project Documentation](./docs/)

## License

By contributing, you agree that your contributions will be licensed under the same license as this project.

Thank you for contributing to Helix! 🚀