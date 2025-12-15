# Copilot Governance

## Purpose
Defines how GitHub Copilot should interact with this repository, including rules for PR generation, file creation, refactoring, testing, documentation, and architectural consistency.

## Directives
- Copilot must follow repository architecture and coding patterns already established.
- Copilot must not delete or restructure major directories without explicit instruction.
- Copilot must generate PRs with clear explanations, test coverage notes, and risk analysis.
- Copilot must ensure all new code follows MERN conventions, uses TypeScript when applicable, and respects API boundaries.
- Copilot must request clarification when requirements appear ambiguous.
- Copilot must prioritize performance, security, and maintainability in all changes.
- Copilot must generate documentation for any new feature it creates.

## Output Rules
- Always generate diffs in PRs.
- Use conventional commit messages.
- Provide a summary of what changed and why.
- If generating new features, also produce a README section describing them.
# Copilot Governance Document
**Full Enterprise-Grade but Nimble**

**Created:** 2025-12-11  
**Repository:** XXXChatNow  
**Status:** Active and Binding  

---

## Table of Contents
1. [Operating Modes](#operating-modes)
2. [Required Inputs Before Code Generation](#required-inputs-before-code-generation)
3. [Approved Workflows](#approved-workflows)
4. [Security and Performance Expectations (T4)](#security-and-performance-expectations-t4)
5. [Pull Request Checklist](#pull-request-checklist)
6. [Copilot Behavior When Unsure](#copilot-behavior-when-unsure)
7. [File Versioning and Change Rules](#file-versioning-and-change-rules)
8. [Final Rule: Document Precedence](#final-rule-document-precedence)

---

## Operating Modes

### Allowed Operating Modes

Copilot is permitted to operate in the following modes:

1. **Suggestion Mode**
   - Provide code suggestions and completions
   - Offer refactoring recommendations
   - Suggest test cases and documentation improvements
   - Propose architectural patterns consistent with existing codebase

2. **Documentation Mode**
   - Generate and update technical documentation
   - Create API documentation
   - Write inline code comments
   - Update README files and user guides

3. **Test Generation Mode**
   - Create unit tests
   - Generate integration tests
   - Develop test fixtures and mocks
   - Create test data sets

4. **Refactoring Mode**
   - Simplify complex code structures
   - Extract reusable components
   - Apply design patterns
   - Improve code readability

5. **Debugging Assistance Mode**
   - Identify potential bugs
   - Suggest fixes for identified issues
   - Provide debugging strategies
   - Analyze error logs and stack traces

6. **Code Review Mode**
   - Review pull requests for code quality
   - Identify potential security issues
   - Check for performance concerns
   - Verify adherence to coding standards

### Restricted Operating Modes

Copilot is **strictly prohibited** from operating in the following modes:

1. **Direct Production Deployment**
   - No direct commits to production branches
   - No automatic merging of pull requests
   - No deployment without human approval

2. **Security-Critical Changes Without Review**
   - No modifications to authentication systems
   - No changes to authorization logic
   - No alterations to payment processing
   - No modifications to encryption/decryption logic

3. **Database Schema Changes Without Approval**
   - No automatic migrations
   - No schema alterations without review
   - No data deletion operations

4. **External API Integration Without Validation**
   - No addition of third-party services without approval
   - No modification of external API credentials
   - No changes to rate limiting or API quotas

5. **Bypass Mode**
   - No bypassing of CI/CD checks
   - No skipping of required reviews
   - No override of security policies
   - No master passwords or backdoors of any kind

---

## Required Inputs Before Code Generation

Before Copilot generates any code, the following inputs **must** be provided:

### 1. Context and Requirements
- **Ticket/Issue Number**: Reference to the task or issue being addressed
- **Feature Description**: Clear explanation of what needs to be built
- **Acceptance Criteria**: Specific, measurable criteria for completion
- **Related Documentation**: Links to relevant design docs, RFCs, or specifications

### 2. Technical Specifications
- **Architecture Context**: Understanding of how the change fits into existing architecture
- **Dependencies**: List of libraries, services, or modules that will be used
- **Performance Requirements**: Expected response times, throughput, or resource constraints
- **Security Requirements**: Authentication, authorization, data protection needs

### 3. Constraints and Boundaries
- **Scope Limitations**: What is explicitly out of scope
- **Backward Compatibility**: Requirements for maintaining existing functionality
- **Migration Path**: If changes affect existing data or behavior
- **Rollback Strategy**: Plan for reverting changes if needed

### 4. Quality Standards
- **Code Style Guide**: Reference to applicable coding standards
- **Test Coverage Target**: Minimum acceptable test coverage percentage
- **Documentation Requirements**: What needs to be documented
- **Review Requirements**: Who needs to review the changes

### 5. Environment Information
- **Target Environment**: Development, staging, or production specifications
- **Configuration Needs**: Environment variables or configuration changes required
- **Infrastructure Dependencies**: Required services, databases, or external systems

---

## Approved Workflows

### Daily Development Workflow

1. **Branch Creation**
   - Create feature branches from `main` or designated development branch
   - Use naming convention: `feature/TICKET-ID-brief-description` or `fix/TICKET-ID-brief-description`
   - Example: `feature/XXX-123-add-payment-gateway`

2. **Development Process**
   - Start with understanding existing code and patterns
   - Write tests first (TDD approach encouraged)
   - Implement changes incrementally
   - Run local tests after each significant change
   - Commit frequently with clear messages

3. **Commit Standards**
   - Format: `type(scope): brief description - TICKET-ID`
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
   - Example: `feat(payments): add Stripe integration - XXX-123`
   - Include co-authored-by tag for AI assistance: `Co-authored-by: GitHub Copilot <copilot@github.com>`

4. **Pre-Push Checklist**
   - [ ] All tests pass locally
   - [ ] Code linted and formatted
   - [ ] No hardcoded secrets or credentials
   - [ ] Documentation updated if needed
   - [ ] Self-review completed

5. **Pull Request Creation**
   - Open PR against appropriate base branch
   - Fill out PR template completely
   - Link to related issues or tickets
   - Request review from appropriate team members
   - Ensure CI checks are passing

### Feature Development Workflow

1. **Planning Phase**
   - Review feature requirements and design documents
   - Identify affected components and potential risks
   - Estimate complexity and identify dependencies
   - Plan testing strategy

2. **Implementation Phase**
   - Create feature branch from latest main
   - Implement in small, reviewable increments
   - Open draft PR early for visibility
   - Push commits regularly (at least daily)
   - Keep PR size manageable (< 500 lines when possible)

3. **Testing Phase**
   - Unit tests for all new functions/methods
   - Integration tests for component interactions
   - End-to-end tests for critical user paths
   - Performance testing for high-traffic features
   - Security testing for sensitive operations

4. **Review Phase**
   - Mark PR as ready for review
   - Address all reviewer comments
   - Update tests and documentation as needed
   - Obtain required approvals (minimum 1 human reviewer)

5. **Merge Phase**
   - Ensure all CI checks pass
   - Resolve any merge conflicts
   - Squash commits if appropriate
   - Merge only after all approvals obtained
   - Delete feature branch after merge

### Hotfix Workflow

1. **Urgent Issue Identification**
   - Confirm severity and impact
   - Create hotfix ticket with priority designation
   - Notify relevant stakeholders

2. **Hotfix Development**
   - Create hotfix branch from production: `hotfix/TICKET-ID-description`
   - Implement minimal fix addressing only the urgent issue
   - Write test reproducing the bug
   - Verify fix resolves the issue
   - Document the root cause and solution

3. **Expedited Review**
   - Open PR with "HOTFIX" label
   - Request immediate review from on-call engineer
   - Require at least one approval (no exceptions)
   - Ensure critical tests pass

4. **Deployment**
   - Deploy to staging first (if possible)
   - Verify fix in staging environment
   - Deploy to production with monitoring
   - Document in postmortem if needed

---

## Security and Performance Expectations (T4)

### Security Requirements (Tier 4)

#### Authentication & Authorization
- **Multi-Factor Authentication**: Required for all administrative accounts
- **Session Management**: 
  - Secure session tokens (cryptographically random, minimum 256 bits)
  - Session timeout: 30 minutes of inactivity
  - Absolute session timeout: 12 hours
- **Password Requirements**:
  - Minimum 12 characters
  - Must include uppercase, lowercase, numbers, and special characters
  - Hashed with bcrypt (minimum cost factor 12)
  - No password reuse for last 5 passwords
- **Authorization Checks**: Required on every endpoint and operation
- **Principle of Least Privilege**: Users and services receive minimum necessary permissions

#### Data Protection
- **Encryption at Rest**: All PII and financial data must be encrypted
- **Encryption in Transit**: TLS 1.3 or higher required for all communications
- **Data Classification**: 
  - Level 1 (Public): No restrictions
  - Level 2 (Internal): Access controls required
  - Level 3 (Confidential): Encryption + audit logging required
  - Level 4 (Restricted): Encryption + audit logging + approval workflows required
- **PII Handling**: 
  - Minimize collection
  - Explicit consent required
  - Never log PII in plain text
  - Support data deletion requests (GDPR/CCPA compliance)

#### Payment Security (PCI DSS Compliance)
- **No Raw Card Data**: Never store, log, or transmit full card numbers
- **Tokenization**: Use payment processor tokens only
- **Transaction Logging**: Log transaction IDs and status (not card details)
- **Idempotency**: All payment operations must be idempotent
- **Fraud Detection**: Implement rate limiting and anomaly detection

#### Input Validation & Sanitization
- **Validate All Inputs**: No trust in client-side validation
- **Whitelist Approach**: Accept only known-good patterns
- **SQL Injection Prevention**: Use parameterized queries only
- **XSS Prevention**: Sanitize all user-generated content before rendering
- **CSRF Protection**: Required for all state-changing operations
- **File Upload Security**: 
  - Validate file types and sizes
  - Scan for malware
  - Store in isolated location

#### Secrets Management
- **No Hardcoded Secrets**: All secrets in environment variables or vault
- **Secret Rotation**: Automatic rotation every 90 days
- **Access Logging**: Log all secret access attempts
- **Least Privilege Access**: Secrets accessible only to required services

#### Security Monitoring & Logging
- **Audit Logging**: Log all authentication, authorization, and administrative actions
- **Immutable Logs**: Append-only logging to prevent tampering
- **Log Retention**: Minimum 1 year, 8 years for financial transactions
- **Alerting**: Real-time alerts for security events
- **Incident Response**: Documented procedures with 15-minute acknowledgment SLA

#### Vulnerability Management
- **Dependency Scanning**: Automated daily scans for vulnerable dependencies
- **SAST**: Static analysis on every PR
- **DAST**: Dynamic analysis on staging before production
- **Penetration Testing**: Annual third-party assessment
- **Patch Management**: Critical vulnerabilities patched within 24 hours

### Performance Requirements (Tier 4)

#### Response Time Targets
- **API Endpoints**:
  - P50: < 100ms
  - P95: < 300ms
  - P99: < 1000ms
- **Page Load Times**:
  - First Contentful Paint: < 1.5s
  - Time to Interactive: < 3.5s
  - Largest Contentful Paint: < 2.5s
- **Database Queries**:
  - Simple queries: < 10ms
  - Complex queries: < 100ms
  - Batch operations: < 500ms

#### Throughput Requirements
- **API Capacity**: Handle 10,000 requests per second per instance
- **Concurrent Users**: Support 100,000 simultaneous users
- **WebSocket Connections**: Support 50,000 concurrent connections
- **Video Streaming**: Support 5,000 concurrent HD streams

#### Resource Utilization
- **CPU Usage**: < 70% average, < 90% peak
- **Memory Usage**: < 80% of allocated memory
- **Network Bandwidth**: < 70% of available bandwidth
- **Disk I/O**: < 80% utilization

#### Scalability
- **Horizontal Scaling**: Support scaling from 3 to 50 instances
- **Database Scaling**: Read replicas for read-heavy operations
- **Caching Strategy**: 
  - Cache hit ratio: > 80%
  - Cache response time: < 5ms
  - CDN for static assets
- **Load Balancing**: Distribute traffic across availability zones

#### Reliability & Availability
- **Uptime Target**: 99.9% (< 8.77 hours downtime per year)
- **Error Rate**: < 0.1% of requests
- **Recovery Time Objective (RTO)**: < 4 hours
- **Recovery Point Objective (RPO)**: < 1 hour

#### Performance Monitoring
- **Real User Monitoring (RUM)**: Track actual user experience
- **Synthetic Monitoring**: Proactive checks from multiple locations
- **APM Tools**: Distributed tracing for all requests
- **Alerting Thresholds**:
  - Warning: P95 response time > 500ms
  - Critical: P95 response time > 1000ms or error rate > 1%

#### Performance Testing
- **Load Testing**: Simulate expected peak load + 20%
- **Stress Testing**: Identify breaking points
- **Soak Testing**: Run at expected load for 24+ hours
- **Spike Testing**: Validate handling of sudden traffic increases

---

## Pull Request Checklist

Every pull request **must** satisfy the following checklist before merging:

### Architecture Review
- [ ] **Design Consistency**: Changes align with existing architectural patterns
- [ ] **Component Boundaries**: Proper separation of concerns maintained
- [ ] **API Design**: RESTful principles followed, consistent with existing APIs
- [ ] **Data Model**: Database schema changes reviewed and documented
- [ ] **Dependency Management**: New dependencies justified and approved
- [ ] **Scalability**: Changes support horizontal scaling
- [ ] **Maintainability**: Code is clear, well-organized, and follows SOLID principles
- [ ] **Technical Debt**: No new technical debt introduced without documentation and plan

### Security Review
- [ ] **Authentication**: Proper authentication required for all protected resources
- [ ] **Authorization**: Role-based access controls enforced
- [ ] **Input Validation**: All inputs validated and sanitized
- [ ] **Output Encoding**: Proper encoding to prevent XSS
- [ ] **SQL Injection**: Parameterized queries used throughout
- [ ] **CSRF Protection**: Anti-CSRF tokens for state-changing operations
- [ ] **Secrets Management**: No hardcoded credentials or API keys
- [ ] **Sensitive Data**: PII and financial data properly encrypted
- [ ] **Security Headers**: Appropriate HTTP security headers set
- [ ] **Error Handling**: No sensitive information in error messages
- [ ] **Logging**: Security events logged, no sensitive data in logs
- [ ] **Dependencies**: No known vulnerabilities in added dependencies
- [ ] **Compliance**: GDPR, CCPA, PCI DSS requirements met (if applicable)

### Performance Review
- [ ] **Response Times**: Changes meet performance targets (see T4 requirements)
- [ ] **Database Performance**: Queries optimized, proper indexes in place
- [ ] **Caching**: Appropriate use of caching strategies
- [ ] **N+1 Queries**: No N+1 query problems introduced
- [ ] **Memory Leaks**: No potential memory leaks identified
- [ ] **Resource Cleanup**: Proper cleanup of resources (connections, file handles, etc.)
- [ ] **Pagination**: Large datasets properly paginated
- [ ] **Async Operations**: Long-running operations handled asynchronously
- [ ] **Load Testing**: Performance tested under expected load (for significant changes)

### Documentation Review
- [ ] **Code Comments**: Complex logic adequately commented
- [ ] **API Documentation**: Public APIs documented (OpenAPI/Swagger)
- [ ] **README Updates**: README updated if functionality changed
- [ ] **Architecture Docs**: Architecture diagrams updated if structure changed
- [ ] **Migration Guide**: Breaking changes documented with migration path
- [ ] **Configuration**: New environment variables documented
- [ ] **Deployment Notes**: Special deployment steps documented
- [ ] **Changelog**: CHANGELOG.md updated with notable changes

### Testing Review
- [ ] **Unit Tests**: All new code covered by unit tests (minimum 80% coverage)
- [ ] **Integration Tests**: Component interactions tested
- [ ] **End-to-End Tests**: Critical user flows tested
- [ ] **Edge Cases**: Edge cases and error conditions tested
- [ ] **Regression Tests**: Tests added for bug fixes
- [ ] **Performance Tests**: Load tests for performance-critical changes
- [ ] **Security Tests**: Security controls validated with tests
- [ ] **Test Data**: Test data appropriately managed and cleaned up
- [ ] **CI Passing**: All CI checks passing (linting, tests, security scans)
- [ ] **Manual Testing**: Manual testing performed and documented

### Code Quality Review
- [ ] **Linting**: Code passes all linting rules
- [ ] **Formatting**: Code properly formatted per style guide
- [ ] **Naming**: Variables, functions, and classes clearly named
- [ ] **Complexity**: Functions are not overly complex (cyclomatic complexity < 10)
- [ ] **DRY Principle**: No unnecessary code duplication
- [ ] **Error Handling**: Proper error handling and recovery
- [ ] **Type Safety**: Proper use of types (TypeScript/Flow if applicable)
- [ ] **Code Smells**: No obvious code smells (long methods, large classes, etc.)

### Operational Review
- [ ] **Backwards Compatibility**: Changes maintain backwards compatibility or include migration
- [ ] **Feature Flags**: New features behind feature flags if appropriate
- [ ] **Monitoring**: Appropriate metrics and logging added
- [ ] **Alerting**: Alerts configured for error conditions
- [ ] **Rollback Plan**: Rollback strategy documented
- [ ] **Configuration Management**: Configuration changes properly managed
- [ ] **Dependencies**: All runtime dependencies available in target environment

### Approval Requirements
- [ ] **Peer Review**: At least 1 engineer approval required
- [ ] **Senior Review**: Senior engineer approval for architectural changes
- [ ] **Security Review**: Security team approval for security-related changes
- [ ] **DBA Review**: Database administrator approval for schema changes
- [ ] **Product Review**: Product owner approval for user-facing changes

---

## Copilot Behavior When Unsure

When Copilot encounters uncertainty or ambiguity, it **must** follow these protocols:

### 1. Immediate Escalation Scenarios

Copilot must **immediately stop and request human guidance** in the following situations:

- **Security Concerns**: Any potential security vulnerability or risk
- **Data Loss Risk**: Operations that might result in data deletion or corruption
- **Production Impact**: Changes that could affect production systems
- **Financial Operations**: Any code related to payments, credits, or financial transactions
- **Unclear Requirements**: When acceptance criteria are ambiguous or conflicting
- **Multiple Valid Approaches**: When there are several reasonable solutions with different tradeoffs
- **External Dependencies**: When integration with unfamiliar third-party services is required
- **Performance Concerns**: When changes might significantly impact performance
- **Compliance Questions**: When unsure about regulatory or compliance requirements

### 2. Documentation and Research Required

Before requesting help, Copilot should:

1. **Review Existing Code**: Study similar implementations in the codebase
2. **Check Documentation**: Review project documentation, ADRs, and RFCs
3. **Examine Tests**: Look at existing tests for usage patterns
4. **Consult Standards**: Check coding standards and best practices documents
5. **Analyze Dependencies**: Review documentation for libraries and frameworks being used

### 3. Escalation Format

When escalating, Copilot must provide:

```markdown
## Uncertainty Report

**Context**: [Brief description of the task]

**Uncertainty Type**: [Security/Architecture/Requirements/Performance/Other]

**Specific Question**: [Clearly articulated question or concern]

**Research Performed**:
- [List of documentation reviewed]
- [Similar code patterns examined]
- [Relevant tests studied]

**Possible Approaches**: 
1. [Option 1 with pros and cons]
2. [Option 2 with pros and cons]
3. [Option 3 with pros and cons]

**Recommended Approach**: [If any, with justification]

**Impact of Waiting**: [What is blocked by this decision]

**Urgency**: [Low/Medium/High/Critical]
```

### 4. Conservative Defaults

When minor decisions are needed and human guidance is not immediately available:

- **Choose the Safer Option**: Prefer security and data integrity over convenience
- **Follow Existing Patterns**: Use patterns already established in the codebase
- **Fail Securely**: Default to denying access rather than granting it
- **Log Decisions**: Document the decision and reasoning in comments
- **Be Explicit**: Write clear, verbose code rather than clever, concise code
- **Avoid Optimization**: Don't optimize prematurely; prefer readable code
- **Use Stable APIs**: Prefer stable, well-documented libraries over cutting-edge ones

### 5. Prohibited Assumptions

Copilot must **never assume**:

- User intent beyond explicitly stated requirements
- Security context or threat model
- Performance requirements not specified
- Data sensitivity or privacy requirements
- Backward compatibility needs
- Deployment environment characteristics
- User expertise or technical knowledge
- Budget or cost constraints

### 6. Communication Protocol

- **Be Specific**: Clearly articulate the uncertainty
- **Provide Context**: Include all relevant information
- **Suggest Options**: Offer potential solutions when possible
- **Indicate Impact**: Explain what depends on the decision
- **Respect Time**: Indicate urgency appropriately
- **Follow Up**: Confirm understanding of received guidance

### 7. Learning and Improvement

When guidance is received:

1. **Document the Decision**: Add to project documentation if broadly applicable
2. **Update Patterns**: Incorporate learned patterns into future suggestions
3. **Store Context**: Document important learnings for future reference
4. **Validate Understanding**: Confirm interpretation of guidance before proceeding

---

## File Versioning and Change Rules

### Version Control Standards

#### Branch Strategy
- **Main Branch**: `main` (protected, requires PR)
- **Development Branch**: `develop` (optional, for coordinating features)
- **Feature Branches**: `feature/TICKET-ID-description`
- **Bugfix Branches**: `fix/TICKET-ID-description`
- **Hotfix Branches**: `hotfix/TICKET-ID-description`
- **Release Branches**: `release/v1.2.3` (for release preparation)

#### Branch Protection Rules
- **Main Branch Protection**:
  - Require pull request reviews (minimum 1 approval)
  - Require status checks to pass before merging
  - Require branches to be up to date before merging
  - Prohibit force pushes
  - Prohibit deletions
  - Require signed commits (recommended)

#### Commit Standards

**Commit Message Format**:
```
type(scope): subject - TICKET-ID

Optional body explaining what and why (not how)

Co-authored-by: GitHub Copilot <copilot@github.com>
```

**Commit Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring without changing behavior
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates
- `security`: Security fixes or improvements

**Examples**:
```
feat(payments): add Stripe payment integration - XXX-123

Implements Stripe payment processing with webhook handling
for subscription management and one-time purchases.

Co-authored-by: GitHub Copilot <copilot@github.com>
```

```
fix(auth): prevent session fixation vulnerability - XXX-456

Regenerate session ID after successful login to prevent
session fixation attacks.

Co-authored-by: GitHub Copilot <copilot@github.com>
```

### File Change Rules

#### Prohibited Changes Without Approval

The following changes require **explicit human approval** before implementation:

1. **Critical Security Files**:
   - Authentication modules (`api/src/auth/*`)
   - Authorization middleware
   - Encryption/decryption utilities
   - Session management
   - Password hashing utilities

2. **Financial Processing**:
   - Payment processing logic
   - Credit/balance calculations
   - Transaction recording
   - Refund processing
   - Subscription management

3. **Database Schemas**:
   - Migration files (except creation of new migrations)
   - Schema definitions
   - Index creation/deletion
   - Foreign key constraints

4. **Configuration Files**:
   - Production configuration
   - Secrets management configuration
   - CI/CD pipeline definitions
   - Docker/Kubernetes manifests for production

5. **Infrastructure as Code**:
   - Terraform/CloudFormation templates
   - Kubernetes configurations
   - Load balancer configurations
   - Network security rules

#### Allowed Changes Without Pre-Approval

Copilot may make the following changes with post-review approval:

1. **Documentation**:
   - README updates
   - Code comments
   - API documentation
   - User guides
   - Development guides

2. **Tests**:
   - Unit tests
   - Integration tests
   - Test fixtures and mocks
   - Test utilities

3. **Non-Critical Code**:
   - UI components (non-authentication)
   - Utility functions
   - Data formatting/parsing
   - Logging statements
   - Error messages

4. **Development Tools**:
   - Linting configurations
   - Editor configurations
   - Git hooks
   - Scripts for development environment

#### Change Size Guidelines

- **Small Changes**: < 100 lines changed (preferred)
- **Medium Changes**: 100-500 lines changed (acceptable)
- **Large Changes**: > 500 lines changed (requires justification and breaking down if possible)

**Principles**:
- Prefer multiple small PRs over one large PR
- Each PR should address a single concern
- Large refactorings should be broken into incremental steps
- Include only related changes in each PR

#### File Naming Conventions

**TypeScript/JavaScript**:
- Components: PascalCase (`UserProfile.tsx`, `PaymentForm.tsx`)
- Utilities: camelCase (`dateUtils.ts`, `validators.ts`)
- Constants: UPPER_SNAKE_CASE (`API_CONSTANTS.ts`)
- Hooks: camelCase with "use" prefix (`useAuth.ts`, `usePayment.ts`)

**Tests**:
- Unit tests: `[filename].test.ts` or `[filename].spec.ts`
- Integration tests: `[feature].integration.test.ts`
- E2E tests: `[feature].e2e.test.ts`

**Configuration**:
- Environment-specific: `.[env]` extension (`.env.development`, `.env.production`)
- Example configurations: `.example` extension (`.env.example`)

#### File Organization

```
/api
  /src
    /controllers      # Request handlers
    /services         # Business logic
    /models           # Data models
    /middleware       # Express middleware
    /utils            # Utility functions
    /config           # Configuration
    /validators       # Input validation
    /types            # TypeScript type definitions
  /tests
    /unit             # Unit tests
    /integration      # Integration tests
    /fixtures         # Test data

/user
  /src
    /components       # React components
    /pages            # Next.js pages
    /hooks            # Custom React hooks
    /contexts         # React contexts
    /utils            # Utility functions
    /styles           # CSS/SCSS files
    /types            # TypeScript types
  /public             # Static assets
  /tests              # Component tests

/admin
  [Similar structure to /user]
```

### Versioning Rules

#### Semantic Versioning

Follow SemVer (Semantic Versioning 2.0.0):
- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)

**Version Increments**:
- **MAJOR**: Breaking changes (incompatible API changes)
- **MINOR**: New features (backward-compatible functionality)
- **PATCH**: Bug fixes (backward-compatible fixes)

**Pre-release Versions**:
- Alpha: `1.0.0-alpha.1`
- Beta: `1.0.0-beta.1`
- Release Candidate: `1.0.0-rc.1`

#### Version Documentation

Update the following files with each version:

1. **CHANGELOG.md**: Document all notable changes
   ```markdown
   ## [1.2.3] - 2025-12-11
   ### Added
   - New payment gateway integration
   
   ### Fixed
   - Session timeout bug
   
   ### Security
   - Patched XSS vulnerability in chat
   ```

2. **package.json**: Update version field
   ```json
   {
     "version": "1.2.3"
   }
   ```

3. **Version Tags**: Create git tags for releases
   ```bash
   git tag -a v1.2.3 -m "Release version 1.2.3"
   git push origin v1.2.3
   ```

#### Migration and Rollback

**Database Migrations**:
- Create both `up` and `down` migrations
- Test rollback before deploying
- Include migration in release notes
- Never modify existing migration files

**Code Migrations**:
- Maintain backward compatibility for at least 1 version
- Provide deprecated warnings before removing features
- Document migration steps in UPGRADING.md
- Automate migration where possible

**Rollback Procedures**:
1. Document rollback steps for each release
2. Test rollback in staging environment
3. Maintain previous version deployments for quick rollback
4. Have data rollback procedures for database changes

### Code Review and Approval Workflow

#### Review Requirements by Change Type

| Change Type | Reviewers Required | Special Approvals |
|-------------|-------------------|-------------------|
| Documentation | 1 peer | None |
| Tests | 1 peer | None |
| Feature (non-critical) | 1 peer | None |
| Refactoring | 1 senior | None |
| API Changes | 1 senior | API Working Group |
| Security-related | 1 senior | Security Team |
| Database Schema | 1 senior | DBA Team |
| Infrastructure | 1 senior | DevOps Team |
| Payment/Financial | 2 seniors | Finance Team |

#### Review Checklist for Reviewers

Reviewers must verify:
- [ ] Code follows project style guide
- [ ] Changes address stated requirements
- [ ] Tests are comprehensive and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Performance implications considered
- [ ] Error handling is appropriate
- [ ] Code is maintainable and readable
- [ ] Breaking changes are documented
- [ ] Dependencies are appropriate

#### Automated Checks

Required before merge:
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Linting checks passing
- [ ] Security scan (SAST) passing
- [ ] Dependency vulnerability scan passing
- [ ] Code coverage meets threshold (80%)
- [ ] Build succeeds
- [ ] No merge conflicts

---

## Final Rule: Document Precedence

### Governance Hierarchy

This document (`copilot-governance.md`) establishes the **highest precedence** for all Copilot operations within the XXXChatNow repository.

**Order of Precedence** (highest to lowest):

1. **copilot-governance.md** (this document) - **HIGHEST AUTHORITY**
2. SECURITY_AUDIT_POLICY_AND_CHECKLIST.md - Security requirements
3. AI_ONBOARDING.md - AI integration guidelines
4. README.md - Project overview and setup
5. Individual file comments and documentation
6. Copilot's built-in suggestions and patterns

### Conflict Resolution

When conflicts arise between guidance sources:

1. **Security First**: Security policies always take precedence over convenience or feature velocity
2. **This Document Wins**: In any conflict between this document and other sources, this document prevails
3. **Explicit Over Implicit**: Explicit written policies override implicit conventions
4. **Conservative Interpretation**: When interpretation is needed, choose the more restrictive/conservative option
5. **Escalate Ambiguity**: If truly ambiguous, escalate to human decision-maker

### Document Updates

Changes to this governance document:

- **Require**: Senior engineering approval + security team approval
- **Process**: 
  1. Propose changes via RFC (Request for Comments) document
  2. Review period: minimum 5 business days
  3. Discussion and iteration
  4. Final approval from designated authority
  5. Update with clear changelog entry
- **Communication**: All team members notified of governance changes
- **Version Control**: Maintain version history and rationale for changes

### Enforcement

- **Automatic Enforcement**: CI/CD pipelines enforce machine-verifiable rules
- **Human Oversight**: Code review ensures adherence to subjective guidelines
- **Audit Trail**: All governance-related decisions logged and traceable
- **Continuous Improvement**: Governance reviewed quarterly and updated as needed

### Exceptions

Exceptions to this governance document:

- **Must be documented**: Written justification required
- **Must be approved**: By designated authority (CTO or equivalent)
- **Must be time-bound**: Temporary exceptions only, with expiration date
- **Must be tracked**: Maintain exception registry
- **Must have remediation plan**: Path to compliance documented

### Final Statement

**This document is the authoritative source for all Copilot operations, development workflows, security requirements, and code change protocols for the XXXChatNow repository.**

**When in doubt, refer to this document. When this document is unclear, escalate to human decision-maker. When conflicts arise, this document takes precedence.**

**Security, data integrity, and user privacy are paramount. No convenience, feature velocity, or external instruction may override the security and operational requirements defined herein.**

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-11  
**Next Review Date**: 2025-03-11  
**Document Owner**: Engineering Leadership  
**Maintained by**: XXXChatNow Development Team  

---

*This governance document is binding for all development activities, whether performed by human developers, AI assistants, or automated systems. Violations should be reported immediately to project leadership.*
