# GitHub Copilot Instructions for XXXChatNow

## Repository Overview

This repository contains **XXXChatNow** - a comprehensive adult video chat platform with separate components for API, Admin panel, and User website.

## Project Structure

```
XXXChatNow/
├── api/              # Backend API (NestJS, TypeScript, PostgreSQL, Redis)
├── admin/            # Admin management panel (Next.js, React, Ant Design)
├── user/             # User website (Next.js, React, Ant Design)
├── config-example/   # Configuration templates
└── .github/          # GitHub workflows and configuration
```

## Critical Documentation

Before making ANY changes, especially to financial/token-based features, you **MUST** read and follow these authoritative documents:

1. **[Contributing Guide](/CONTRIBUTING.md)** - Development workflow and requirements
2. **[Security Audit Policy](/SECURITY_AUDIT_POLICY_AND_CHECKLIST.md)** - Security requirements and audit checklist
3. **[Copilot Governance](/COPILOT_GOVERNANCE.md)** - Governance standards for all features
4. **[AI Onboarding Guide](/AI_ONBOARDING.md)** - Guidelines for AI assistant integration

## Component-Specific Setup

### API Component
```bash
cd api
yarn install
# Copy env.sample to .env and configure
yarn dev
```

### Admin Component
```bash
cd admin
yarn install
# Copy env.example to .env and configure
yarn dev
```

### User Component
```bash
cd user
yarn install
# Copy env.example to .env and configure
yarn dev
```

## Development Standards

### Technology Stack
- **Backend**: NestJS (TypeScript), PostgreSQL, Redis
- **Frontend**: Next.js, React, Ant Design, TypeScript
- **Package Manager**: Yarn

### Code Style
- **Linter**: ESLint
- **Naming Conventions**:
  - `camelCase` for variables and functions
  - `PascalCase` for classes and types
  - `UPPER_SNAKE_CASE` for constants

### Comments
- Explain **WHY**, not **WHAT** (code should be self-documenting)
- Add comments for complex logic, non-obvious decisions, and workarounds
- Keep comments up-to-date with code changes

## Security Requirements (CRITICAL)

### Absolute Prohibitions
**These are CRITICAL SECURITY DEFECTS that block all merges:**
- ❌ NO backdoors, master passwords, or magic authentication strings
- ❌ NO hardcoded credentials or secrets
- ❌ NO trusting client-side data for financial operations
- ❌ NO using Math.random() for token-related features (use CSPRNG)
- ❌ NO logging sensitive data (PII, payment details, session tokens)

### Required Security Practices
- ✅ All financial/token endpoints MUST require authentication
- ✅ Authorization checks MUST verify user owns the resource
- ✅ ALL token calculations and validations MUST occur server-side
- ✅ Use parameterized database queries (prevent SQL injection)
- ✅ Sanitize all user inputs (prevent XSS)
- ✅ Rate limiting on all sensitive operations
- ✅ Idempotency keys for all state-changing operations
- ✅ Complete audit trail for all financial operations

## Testing Requirements

### Test Coverage
- Unit tests for all service methods
- Integration tests for all API endpoints
- Test edge cases and error conditions

### Required Test Scenarios
For financial/token features, must test:
- Insufficient balance scenarios
- Race condition handling
- Idempotency (duplicate requests)
- Rate limiting enforcement
- Invalid input handling
- Concurrent operations
- Authentication bypass attempts
- Authorization boundary violations

## Documentation Requirements

Documentation MUST be updated in the SAME pull request when you:
- Add new API endpoints
- Modify existing API behavior
- Change database schema
- Add new features
- Change configuration options

## Pull Request Requirements

### Before Submitting PR
```bash
# For each component, run checks
cd api && yarn lint && yarn test
cd admin && yarn lint
cd user && yarn lint
```

### PR Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code commented where necessary (WHY, not WHAT)
- [ ] Documentation updated
- [ ] Tests added/updated with adequate coverage
- [ ] All tests pass
- [ ] No new warnings generated
- [ ] Security considerations addressed
- [ ] No sensitive data in logs or comments

## Branch Naming Convention

```
{type}/{short-description}

Types:
- feature/     New feature development
- bugfix/      Bug fixes
- hotfix/      Emergency production fixes
- refactor/    Code refactoring
- docs/        Documentation updates
- test/        Test additions or updates
- chore/       Maintenance tasks
```

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

Examples:
feat(api): add user authentication endpoint
fix(admin): correct user list pagination
docs(readme): update setup instructions
```

## Common Pitfalls to Avoid

### Security
- ❌ Trusting client-provided user IDs (use authenticated session)
- ❌ String concatenation in SQL queries (use parameterized queries)
- ❌ Using `innerHTML` with user input (use `textContent` or sanitize)
- ❌ Logging tokens, passwords, or PII
- ❌ Hardcoding secrets in code (use environment variables)

### Performance
- ❌ N+1 query problems
- ❌ Missing database indexes
- ❌ Loading entire result sets instead of paginating
- ❌ Synchronous operations that should be async

## AI Assistant Workflow

As an AI assistant working on this codebase:

1. **Always read the authoritative documentation first** before making changes
2. **Preserve security and auditability** - humans retain final decision-making
3. **Focus on minimal, surgical changes** - change as few lines as possible
4. **Never introduce backdoors or security vulnerabilities** under any circumstances
5. **Create descriptive branch names** following conventions
6. **Include clear commit messages** with context and references
7. **Open PRs with complete context** including checklists and test results
8. **Require at least one human reviewer** for all changes
9. **Never merge your own PRs** - humans must approve and merge
10. **Surface uncertainty** and propose multiple options when appropriate

## Questions or Support

For current contact information, see the [Contributing Guide](/CONTRIBUTING.md).

---

**Remember**: Security, auditability, and data integrity are non-negotiable. When in doubt, ask for human guidance.
