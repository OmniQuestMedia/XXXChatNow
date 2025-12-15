# Contributing to XXXChatNow

Thank you for considering contributing to XXXChatNow! This document provides guidelines and requirements for contributing to the platform.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Documentation Requirements](#documentation-requirements)
5. [Token-Based Features](#token-based-features)
6. [Pull Request Process](#pull-request-process)
7. [Testing Requirements](#testing-requirements)
8. [Code Style](#code-style)
9. [Security](#security)
10. [Questions and Support](#questions-and-support)

---

## Code of Conduct

We are committed to providing a welcoming and professional environment for all contributors. Please be respectful and constructive in all interactions.

### Expected Behavior

- Be professional and respectful
- Provide constructive feedback
- Focus on what is best for the platform and users
- Show empathy towards other contributors

### Unacceptable Behavior

- Harassment or discriminatory language
- Personal attacks or trolling
- Publishing private information without permission
- Unethical or unprofessional conduct

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js (v16+) and Yarn installed
- PostgreSQL database access (for local development)
- Git configured with your name and email
- Access to the repository (contact team if needed)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/OmniQuestMedia/XXXChatNow.git
   cd XXXChatNow
   ```

2. **Install dependencies**:
   ```bash
   # API
   cd api && yarn install
   
   # User frontend
   cd ../user && yarn install
   
   # Admin frontend
   cd ../admin && yarn install
   ```

3. **Configure environment**:
   - Copy environment templates from `config-example/`
   - Update with your local configuration
   - Never commit `.env` files

4. **Run locally**:
   ```bash
   # API
   cd api && yarn start:dev
   
   # User frontend
   cd user && yarn dev
   
   # Admin frontend
   cd admin && yarn dev
   ```

### Read the Documentation

**BEFORE making any changes, read these authoritative documents:**

- **[Copilot Engineering Rules](/docs/copilot/COPILOT.md)** - Mandatory for all token-based features
- **[Engineering Standards](/docs/governance/ENGINEERING_STANDARDS.md)** - Platform-wide standards
- **[Slot Machine Specification](/docs/specs/SLOT_MACHINE_SPEC_v1.0.md)** - Example feature specification
- **[Security Audit Policy](/SECURITY_AUDIT_POLICY_AND_CHECKLIST.md)** - Security requirements

---

## Development Workflow

### Branch Naming Convention

Use descriptive branch names following this pattern:

```
{type}/{short-description}

Types:
- feature/    New feature development
- bugfix/     Bug fixes
- hotfix/     Emergency production fixes
- refactor/   Code refactoring
- docs/       Documentation updates
- test/       Test additions or updates
- chore/      Maintenance tasks

Examples:
- feature/add-chip-menu-ui
- bugfix/fix-token-race-condition
- docs/update-api-documentation
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]

Examples:
feat(tokens): add server-side balance validation
fix(slot-machine): prevent duplicate spin transactions
docs(api): update slot machine endpoint documentation
```

### Development Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes** following all standards

3. **Write tests** for your changes

4. **Run tests locally**:
   ```bash
   yarn test
   yarn lint
   ```

5. **Commit your changes** with clear messages

6. **Push to your branch**:
   ```bash
   git push origin feature/my-feature
   ```

7. **Open a Pull Request** using the PR template

---

## Documentation Requirements

### When to Update Documentation

Documentation must be updated in the SAME pull request when you:

- Add new API endpoints
- Modify existing API behavior
- Change database schema
- Add new features
- Change configuration options
- Update dependencies with breaking changes

### Required Documentation

Depending on your changes, you may need to update:

#### For New Features

1. **Feature Specification** (`/docs/specs/`)
   - Complete specification following Slot Machine spec as template
   - Include security requirements, API design, data models
   - Document acceptance criteria

2. **API Documentation** (`/docs/api/`)
   - OpenAPI/Swagger definitions
   - Request/response examples
   - Error codes and handling

3. **Database Documentation** (`/docs/database/`)
   - Schema diagrams
   - Migration scripts
   - Index strategies

4. **Runbook** (`/docs/runbooks/`)
   - Deployment procedures
   - Configuration management
   - Troubleshooting guide

#### For Bug Fixes

- Update relevant documentation if behavior changes
- Add notes to known issues if applicable
- Update troubleshooting guides

#### For Refactoring

- Update architecture diagrams if structure changes
- Update code comments if logic changes
- Update API docs if signatures change

---

## Token-Based Features

**All features involving tokens, credits, payments, promotions, chip menu, or slot machine must follow strict requirements.**

### Mandatory Reading

Before working on token-based features, you **MUST** read:

1. **[Copilot Engineering Rules](/docs/copilot/COPILOT.md)** - Complete checklist
2. **[Engineering Standards](/docs/governance/ENGINEERING_STANDARDS.md)** - All applicable sections
3. **[Security Audit Policy](/SECURITY_AUDIT_POLICY_AND_CHECKLIST.md)** - Security checklist

### Critical Requirements

#### Security
- ✅ Server-authoritative design (never trust client)
- ✅ Cryptographically secure RNG for game mechanics
- ✅ Complete audit trail for all token operations
- ✅ Idempotency for all state-changing operations
- ✅ Rate limiting to prevent abuse
- ❌ No backdoors, magic strings, or bypass mechanisms

#### Testing
- ✅ Minimum 90% test coverage (100% for token calculations)
- ✅ Load testing meeting performance SLAs
- ✅ Security testing (auth, authorization, input validation)
- ✅ Race condition testing
- ✅ Idempotency testing

#### Performance
- ✅ Response times meet SLA requirements
- ✅ Database queries optimized with proper indexes
- ✅ Load tested at 3x expected peak load
- ✅ Monitoring and alerting configured

#### Compliance
- ✅ Age verification enforced
- ✅ Spending limits configurable
- ✅ Terms of service acceptance required
- ✅ Jurisdictional restrictions enforced
- ✅ Legal review completed

### Token Feature Checklist

Before submitting a PR for token-based features, verify:

- [ ] **Read all mandatory documentation**
- [ ] **Security review completed** (no backdoors, proper auth/authz)
- [ ] **Server-side validation** for all token operations
- [ ] **Audit logging** complete and immutable
- [ ] **Idempotency** implemented with proper key management
- [ ] **Rate limiting** configured and tested
- [ ] **Tests written** with 90%+ coverage
- [ ] **Load testing** completed and meets SLAs
- [ ] **Database indexes** added and verified
- [ ] **API documentation** updated
- [ ] **Security scan** passed (no critical vulnerabilities)
- [ ] **Stakeholder approval** obtained (if required)

---

## Pull Request Process

### Before Submitting

1. **Run all checks locally**:
   ```bash
   # Run tests
   yarn test
   
   # Run linter
   yarn lint
   
   # Run type checks (TypeScript)
   yarn tsc --noEmit
   
   # Run security scan
   yarn audit
   ```

2. **Ensure code quality**:
   - No linter errors or warnings
   - All tests pass
   - Test coverage meets requirements
   - No security vulnerabilities

3. **Update documentation**:
   - API docs updated (if applicable)
   - README updated (if applicable)
   - Inline code comments added for complex logic

### PR Template

When creating a PR, include:

```markdown
## Description
[Clear description of what this PR does]

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update
- [ ] Token-based feature (requires enhanced review)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code commented where necessary
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No new warnings generated
- [ ] Security considerations addressed

## Token Feature Checklist (if applicable)
- [ ] Read Copilot Engineering Rules
- [ ] Server-authoritative design
- [ ] Audit logging complete
- [ ] Idempotency implemented
- [ ] Rate limiting configured
- [ ] 90%+ test coverage
- [ ] Load testing completed
- [ ] Security review passed

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Related Issues
Closes #[issue number]

## Additional Notes
[Any additional context or notes for reviewers]
```

### PR Review Process

1. **Automated Checks**: CI/CD runs tests, linters, security scans
2. **Peer Review**: At least one engineer reviews code
3. **Security Review**: Required for token-based features
4. **Documentation Review**: Verify docs are complete and accurate
5. **Approval**: All reviewers approve
6. **Merge**: Maintainer merges PR

### Review Response Time

- **High Priority (Production bugs)**: 4 hours
- **Normal Priority**: 24 hours
- **Low Priority**: 48 hours

### Addressing Review Feedback

- **Respond to all comments** with changes or explanations
- **Push updates** to the same branch
- **Re-request review** after addressing feedback
- **Be open to feedback** and collaborative

---

## Testing Requirements

### Test Types

#### Unit Tests
- **Coverage**: 90% minimum (100% for token logic)
- **Framework**: Jest (JavaScript/TypeScript), pytest (Python)
- **Location**: `tests/unit/`
- **Run**: `yarn test:unit`

#### Integration Tests
- **Coverage**: All API endpoints
- **Framework**: Jest + Supertest (API)
- **Location**: `tests/integration/`
- **Run**: `yarn test:integration`

#### Load Tests
- **Required For**: Token-based features, high-traffic endpoints
- **Framework**: k6, Artillery, or JMeter
- **Location**: `tests/load/`
- **Run**: `yarn test:load`

#### Security Tests
- **Required For**: All features (especially token-based)
- **Tools**: OWASP ZAP, npm audit, Snyk
- **Run**: `yarn test:security`

### Writing Tests

```javascript
// Example unit test
describe('TokenService', () => {
  describe('deductBalance', () => {
    it('should deduct tokens when balance sufficient', async () => {
      // Arrange
      const userId = 'user-123';
      const amount = 100;
      const initialBalance = 500;
      
      // Act
      const result = await tokenService.deductBalance(userId, amount);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(400);
    });
    
    it('should reject when balance insufficient', async () => {
      // Arrange
      const userId = 'user-123';
      const amount = 600;
      const initialBalance = 500;
      
      // Act & Assert
      await expect(
        tokenService.deductBalance(userId, amount)
      ).rejects.toThrow('INSUFFICIENT_BALANCE');
    });
  });
});
```

---

## Code Style

### General Principles

- **DRY**: Don't Repeat Yourself
- **SOLID**: Follow SOLID principles
- **KISS**: Keep It Simple, Stupid
- **Clean Code**: Self-documenting over comments

### JavaScript/TypeScript

- **Style Guide**: Airbnb JavaScript Style Guide
- **Linter**: ESLint with security plugins
- **Formatter**: Prettier
- **Naming**:
  - `camelCase` for variables and functions
  - `PascalCase` for classes and types
  - `UPPER_SNAKE_CASE` for constants
  - Descriptive names over short names

### File Organization

```
src/
  modules/
    slot-machine/
      controllers/      # HTTP controllers
      services/         # Business logic
      models/           # Data models
      dto/              # Data transfer objects
      schemas/          # Database schemas
      tests/            # Tests for this module
      slot-machine.module.ts
```

### Comments

- **When to comment**: Complex logic, non-obvious decisions, workarounds
- **When not to comment**: Self-explanatory code
- **Format**: Clear, concise, up-to-date

```javascript
// Good: Explains WHY
// Use exponential backoff to handle transient failures
// without overwhelming the loyalty API
const retryDelay = Math.pow(2, retryCount) * 100;

// Bad: Explains WHAT (code already shows this)
// Multiply 2 to the power of retryCount and multiply by 100
const retryDelay = Math.pow(2, retryCount) * 100;
```

---

## Security

### Security First

Security is **non-negotiable**. All code must follow security best practices.

### Common Security Issues to Avoid

#### ❌ SQL Injection
```javascript
// BAD: Vulnerable to SQL injection
const query = `SELECT * FROM users WHERE id = ${userId}`;

// GOOD: Use parameterized queries
const query = 'SELECT * FROM users WHERE id = $1';
const result = await db.query(query, [userId]);
```

#### ❌ XSS (Cross-Site Scripting)
```javascript
// BAD: Vulnerable to XSS
element.innerHTML = userInput;

// GOOD: Use text content or sanitize
element.textContent = userInput;
// OR
element.innerHTML = sanitize(userInput);
```

#### ❌ Authentication Bypass
```javascript
// BAD: Trusting client-provided user ID
const userId = req.body.userId;

// GOOD: Use authenticated user from session
const userId = req.user.id;
```

#### ❌ Sensitive Data Exposure
```javascript
// BAD: Logging sensitive data
console.log('User token:', token);

// GOOD: Log only non-sensitive data
console.log('Token length:', token.length);
```

### Security Checklist

Before submitting ANY code:

- [ ] No hardcoded credentials or secrets
- [ ] Input validation on all user inputs
- [ ] Parameterized database queries (no string concatenation)
- [ ] Authentication required for protected endpoints
- [ ] Authorization checks verify resource ownership
- [ ] No sensitive data in logs
- [ ] HTTPS enforced (no HTTP)
- [ ] Rate limiting on authentication endpoints
- [ ] Dependencies up-to-date (no known vulnerabilities)

### Reporting Security Issues

**Do not open public issues for security vulnerabilities.**

Contact: security-team@xxxchatnow.com

---

## Questions and Support

### Getting Help

- **Technical Questions**: engineering-team@xxxchatnow.com
- **Security Questions**: security-team@xxxchatnow.com
- **Process Questions**: product-team@xxxchatnow.com

### Documentation

- **Copilot Rules**: [/docs/copilot/COPILOT.md](/docs/copilot/COPILOT.md)
- **Engineering Standards**: [/docs/governance/ENGINEERING_STANDARDS.md](/docs/governance/ENGINEERING_STANDARDS.md)
- **Feature Specs**: [/docs/specs/](/docs/specs/)
- **Security Policy**: [/SECURITY_AUDIT_POLICY_AND_CHECKLIST.md](/SECURITY_AUDIT_POLICY_AND_CHECKLIST.md)

### Community

- **Be respectful** and professional
- **Help others** when you can
- **Share knowledge** and learnings
- **Provide constructive feedback**

---

## License

By contributing to XXXChatNow, you agree that your contributions will be licensed under the same license as the project.

---

## Thank You!

Thank you for contributing to XXXChatNow! Your efforts help make the platform better for models, users, and the entire community.

For questions or clarifications about contributing:
- Technical: engineering-team@xxxchatnow.com
- General: general@OQMINC.com
