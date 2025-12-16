# GitHub Copilot Instructions for XXXChatNow/RedRoomRewards

## Repository Overview

**This repository now contains RedRoomRewards only** - the authoritative rewards and value management system. The legacy XXXChatNow codebase has been archived in `_archive/xxxchatnow-seed/` and should NOT be referenced or modified.

**Version**: V1.0.3

## Critical: Read These Documents First

Before making ANY changes, especially to token-based features, you **MUST** read and follow these authoritative documents:

1. **[Copilot Engineering Rules](/docs/copilot/COPILOT.md)** - Mandatory rules for all token-based feature development, including non-regression rules and PR checklists
2. **[Engineering Standards](/docs/governance/ENGINEERING_STANDARDS.md)** - Cross-cutting governance for all token-based features
3. **[Security Audit Policy](/SECURITY_AUDIT_POLICY_AND_CHECKLIST.md)** - Security requirements and audit checklist
4. **[AI Onboarding Guide](/AI_ONBOARDING.md)** - Guidelines for AI assistant integration
5. **[Contributing Guide](/CONTRIBUTING.md)** - Development workflow and requirements

## Project Structure

```
.github/              # GitHub configuration
docs/
  copilot/           # Copilot engineering rules
  governance/        # Engineering standards
  specs/             # Feature specifications
_archive/            # Archived legacy code (DO NOT MODIFY)
```

## Commands

**Note**: This repository is currently in a documentation/planning phase. The commands below are templates that will be implemented as the RedRoomRewards system is developed. Update package.json and these instructions when source code is added.

### Linting
```bash
npm run lint              # Check for lint errors (to be configured for actual source structure)
npm run lint:fix          # Auto-fix lint errors
```

### Formatting
```bash
npm run format            # Format all files (to be configured for actual source structure)
npm run format:check      # Check formatting
```

### Testing
**Note**: Testing infrastructure will be added as the RedRoomRewards system is developed. Test commands should follow these patterns:
```bash
npm test                  # Run all tests (to be implemented)
npm run test:unit         # Run unit tests only (to be implemented)
npm run test:integration  # Run integration tests (to be implemented)
npm run test:load         # Run load tests (to be implemented)
npm run test:security     # Run security tests (to be implemented)
```

### Security
```bash
npm audit                 # Check for vulnerabilities (when dependencies are added)
```

## Coding Standards

### JavaScript/TypeScript Style
- **Style Guide**: Airbnb JavaScript Style Guide
- **Linter**: ESLint with security plugins
- **Formatter**: Prettier
- **Naming Conventions**:
  - `camelCase` for variables and functions
  - `PascalCase` for classes and types
  - `UPPER_SNAKE_CASE` for constants
  - Use descriptive names over short names

### File Organization
**Future structure** (to be implemented when RedRoomRewards system is developed):
```
src/
  modules/
    {feature-name}/
      controllers/      # HTTP controllers
      services/         # Business logic
      models/           # Data models
      dto/              # Data transfer objects
      schemas/          # Database schemas
      tests/            # Tests for this module
```

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
- ✅ All token/financial endpoints MUST require authentication
- ✅ Authorization checks MUST verify user owns the resource
- ✅ ALL token calculations and validations MUST occur server-side
- ✅ Use parameterized database queries (prevent SQL injection)
- ✅ Sanitize all user inputs (prevent XSS)
- ✅ Rate limiting on all token operations
- ✅ Idempotency keys for all state-changing operations
- ✅ Complete audit trail for all token operations

## Token-Based Features (CRITICAL)

**All features involving tokens, credits, payments, promotions, chip menu, or slot machine MUST follow strict requirements.**

### Non-Regression Rules (NEVER VIOLATE)
1. **NEVER** modify existing token balance calculation logic without explicit approval
2. **NEVER** delete or modify transaction history records (append-only)
3. **NEVER** remove or weaken idempotency guarantees
4. **NEVER** introduce race conditions in balance updates
5. **NEVER** trust client-side data for financial operations

### Required for Token Features
- ✅ Server-authoritative design (client only displays, never determines outcomes)
- ✅ Database transactions with proper rollback on failure
- ✅ Cryptographically secure RNG for game mechanics
- ✅ Complete audit logging (user ID, operation, amount, reason, transaction ID, timestamp, session ID, IP, idempotency key)
- ✅ Idempotency implementation to prevent duplicate transactions
- ✅ Race condition protection (database-level locking or optimistic concurrency)
- ✅ **Minimum 90% test coverage** (100% for token calculations)
- ✅ Load testing meeting performance SLAs
- ✅ Security testing (authentication, authorization, input validation)
- ✅ Response times: balance queries < 100ms, operations < 200ms, game spins < 300ms (p95)

### Database Standards for Token Features
- Use **INTEGER** for token amounts (NEVER FLOAT) - Floating point arithmetic has precision issues that can cause rounding errors in financial calculations. Store amounts in smallest unit (e.g., cents for currency, individual tokens)
- Include proper indexes for query performance
- Implement foreign key constraints
- Use UUIDs for transaction IDs
- Include `created_at` and `updated_at` timestamps
- Add soft delete flags (`is_deleted`, `deleted_at`) rather than hard deletes
- Transaction retention: 8 years total (18 months hot storage + 6.5 years cold storage)

## Testing Requirements

### Test Coverage
- **Minimum 90% coverage** for token-related business logic
- **100% coverage** for transaction and balance calculation logic
- Unit tests for all service methods
- Integration tests for all API endpoints
- Load tests for all game features

### Required Test Scenarios
Every token feature must test:
- Insufficient balance scenarios
- Race condition handling
- Idempotency (duplicate requests)
- Rate limiting enforcement
- Invalid input handling
- Edge cases (zero, negative, overflow)
- Concurrent operations
- Authentication bypass attempts
- Authorization boundary violations

## Documentation Requirements

### When to Update Documentation
Documentation MUST be updated in the SAME pull request when you:
- Add new API endpoints
- Modify existing API behavior
- Change database schema
- Add new features
- Change configuration options

### Required Documentation
- **Feature Specifications** (`/docs/specs/`) - Complete spec with security, API, data models
- **API Documentation** (`/docs/api/`) - OpenAPI/Swagger with examples
- **Database Documentation** (`/docs/database/`) - Schema diagrams, migrations, indexes
- **Runbooks** (`/docs/runbooks/`) - Deployment, configuration, troubleshooting

## Pull Request Requirements

### Before Submitting PR
```bash
# Run all checks locally
npm run lint              # Must pass
npm test                  # Must pass
npm audit                 # Must have no critical vulnerabilities
```

### PR Checklist (Standard)
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code commented where necessary (WHY, not WHAT)
- [ ] Documentation updated
- [ ] Tests added/updated with adequate coverage
- [ ] All tests pass
- [ ] No new warnings generated
- [ ] Security considerations addressed
- [ ] No sensitive data in logs or comments

### PR Checklist (Token-Based Features)
**Additional requirements for token/financial features:**
- [ ] Read Copilot Engineering Rules (/docs/copilot/COPILOT.md)
- [ ] NO backdoors, magic strings, or bypass mechanisms
- [ ] Server-authoritative design (client never determines outcomes)
- [ ] Audit logging complete and immutable
- [ ] Idempotency implemented with proper key management
- [ ] Race condition protection verified
- [ ] Rate limiting configured and tested
- [ ] 90%+ test coverage (100% for token calculations)
- [ ] Load testing completed and meets SLAs
- [ ] Database queries optimized with proper indexes
- [ ] Security review passed
- [ ] Use INTEGER for token amounts (not FLOAT)
- [ ] Use cryptographically secure RNG (not Math.random())

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

Examples:
- feature/add-chip-menu-ui
- bugfix/fix-token-race-condition
- docs/update-api-documentation
```

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

Examples:
feat(tokens): add server-side balance validation
fix(slot-machine): prevent duplicate spin transactions
docs(api): update slot machine endpoint documentation
test(tokens): add race condition tests
```

## Common Pitfalls to Avoid

### Security
- ❌ Trusting client-provided user IDs (use `req.user.id` from session)
- ❌ String concatenation in SQL queries (use parameterized queries)
- ❌ Using `innerHTML` with user input (use `textContent` or sanitize)
- ❌ Logging tokens, passwords, or PII
- ❌ Hardcoding secrets in code (use environment variables)

### Token Features
- ❌ Using `Math.random()` for game outcomes (use cryptographically secure RNG)
- ❌ Floating point for currency/tokens (causes precision errors; use integers for smallest unit like cents or individual tokens)
- ❌ Missing idempotency keys on state changes
- ❌ Missing audit logs for token operations
- ❌ Client-side token calculations or validations
- ❌ Modifying transaction history (always append-only)

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

## Escalation

### High-Risk Changes
Require additional approval for:
- Modifications to core balance calculation
- Changes to transaction logging
- New token-based game features
- Changes to authentication/authorization
- Database schema changes affecting transactions
- Changes to RNG implementation

### Critical Changes
Require approval from ALL stakeholders for:
- Removal or weakening of security controls
- Changes to audit logging or retention
- Modifications to idempotency logic
- Changes affecting money/token calculations

## Questions or Support

For current contact information, see the [Contributing Guide](/CONTRIBUTING.md#questions-and-support).

---

**Remember**: Security, auditability, and data integrity are non-negotiable. When in doubt, ask for human guidance.
