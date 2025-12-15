# GitHub Copilot Engineering Rules & PR Checklist

**Version**: 1.0  
**Last Updated**: 2025-12-15  
**Status**: Authoritative  
**Applies To**: All token-based features, chip menu, slot machine, promotions, and related financial/ledger operations

---

## Purpose

This document defines **mandatory engineering rules** for GitHub Copilot and all developers working on token-based features in the XXXChatNow platform. These rules ensure security, auditability, consistency, and compliance across all features involving tokens, credits, payments, and promotions.

**This document is authoritative and must be followed for all future feature and PR work.**

---

## Non-Regression Rules

### Rule 1: Never Break Existing Token Balance Logic
- **NEVER** modify existing token balance calculation logic without explicit approval and comprehensive test coverage
- All changes to balance-related code must include:
  - Unit tests covering edge cases (zero balance, negative attempts, overflow)
  - Integration tests verifying end-to-end balance flows
  - Database transaction tests ensuring ACID properties

### Rule 2: Preserve Audit Trail Integrity
- **NEVER** delete or modify transaction history records
- All token operations must create immutable audit records
- Transaction tables must be append-only
- Any archive operation must preserve complete audit trail per retention policy (8 years: 1.5 years hot + 6.5 years cold)

### Rule 3: Maintain Idempotency
- **NEVER** remove or weaken idempotency guarantees on financial operations
- All state-changing token operations must support idempotency keys
- Duplicate transaction prevention must be tested and verified

### Rule 4: Protect Against Race Conditions
- **NEVER** introduce race conditions in balance updates
- Use database-level locking or optimistic concurrency control
- Test concurrent operations with load tests

### Rule 5: Server-Side Validation is Sacred
- **NEVER** trust client-side data for financial operations
- All token calculations, payouts, and validations must occur server-side
- Client can only display data, not determine outcomes

---

## Mandatory Engineering Rules for Copilot & Developers

### Security Rules

#### SEC-1: Authentication & Authorization
- All token/financial endpoints **MUST** require valid authentication
- Authorization checks **MUST** verify user owns the resource
- No bypass mechanisms or "magic strings" allowed
- Rate limiting **MUST** be implemented on all token operations

#### SEC-2: No Backdoors Policy (Absolute)
Strictly prohibited:
- Master passwords or override credentials
- Magic authentication strings
- Hidden admin endpoints that bypass normal auth
- Developer flags that affect production token logic
- Emergency access shortcuts

**Violations are CRITICAL SECURITY DEFECTS and block all merges.**

#### SEC-3: Cryptographic Security
- Use cryptographically secure random number generators (CSPRNG) for all game mechanics
- Never use Math.random() or predictable RNG for token-related features
- All RNG implementations must be auditable and reproducible for specific transactions

#### SEC-4: Data Protection
- Encrypt sensitive transaction data at rest (AES-256)
- Use TLS 1.3 for all API communications
- Never log sensitive data (PII, payment details, session tokens)
- Implement proper sanitization for all user inputs

### Data Integrity Rules

#### DATA-1: Transaction Atomicity
- All token operations **MUST** be atomic (all-or-nothing)
- Use database transactions with proper rollback on failure
- Implement compensating transactions for distributed operations

#### DATA-2: Balance Consistency
- Token balances **MUST** always match sum of transaction history
- Implement reconciliation checks in monitoring
- Log any balance discrepancies as critical alerts

#### DATA-3: Audit Logging
Every token operation must log:
- User ID
- Operation type (debit/credit)
- Amount
- Reason/source (e.g., "slot_machine_win", "chip_purchase")
- Transaction ID (unique, immutable)
- Timestamp (ISO8601)
- Session ID
- IP address (for fraud detection)
- Idempotency key

#### DATA-4: Database Schema Standards
- Use appropriate data types (INTEGER for token amounts, not FLOAT)
- Include proper indexes for query performance
- Implement foreign key constraints
- Use UUIDs for transaction IDs
- Include created_at and updated_at timestamps
- Add soft delete flags (is_deleted, deleted_at) rather than hard deletes

### Performance Rules

#### PERF-1: Response Time Requirements
- Token balance queries: < 100ms (p95)
- Token deduction operations: < 200ms (p95)
- Token credit operations: < 200ms (p95)
- Game spin operations: < 300ms (p95)

#### PERF-2: Database Optimization
- All queries must use appropriate indexes
- Implement query pagination for history endpoints
- Use database connection pooling
- Cache frequently accessed configuration data

#### PERF-3: Scalability
- Design for horizontal scaling
- Avoid single points of failure
- Implement circuit breakers for external dependencies
- Use job queues for async operations

### Testing Rules

#### TEST-1: Test Coverage Requirements
- **Minimum 90% code coverage** for token-related business logic
- 100% coverage for transaction and balance calculation logic
- Unit tests for all service methods
- Integration tests for all API endpoints
- Load tests for all game features

#### TEST-2: Required Test Scenarios
Every token feature must test:
- Insufficient balance scenarios
- Race condition handling
- Idempotency (duplicate requests)
- Rate limiting enforcement
- Invalid input handling
- Edge cases (zero, negative, overflow)
- Concurrent operations

#### TEST-3: Security Testing
- Test authentication bypass attempts
- Test authorization boundary violations
- Test SQL injection vectors
- Test rate limit bypass attempts
- Test session hijacking scenarios

---

## PR Checklist for Token/Token-Based Features

**Copilot MUST run this checklist for all PRs involving tokens, promotions, chip menu, or slot machine features.**

### Pre-Submission Checklist

#### Code Quality
- [ ] Code follows project style guidelines and conventions
- [ ] No commented-out code or debug statements
- [ ] No TODOs without linked issues
- [ ] All functions have clear, descriptive names
- [ ] Complex logic includes explanatory comments

#### Security Checklist
- [ ] **CRITICAL**: No backdoors, master passwords, or magic strings
- [ ] All endpoints require authentication
- [ ] Authorization checks verify resource ownership
- [ ] Rate limiting implemented
- [ ] Input validation on all parameters
- [ ] CSPRNG used for any randomness
- [ ] No sensitive data in logs
- [ ] Idempotency keys implemented for state changes
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified

#### Data Integrity Checklist
- [ ] Database transactions used for all token operations
- [ ] Rollback logic implemented for failures
- [ ] Audit logging complete for all operations
- [ ] Transaction IDs unique and immutable
- [ ] Timestamps in ISO8601 format
- [ ] Balances stored as integers (not floats)
- [ ] Foreign key constraints defined
- [ ] Indexes added for performance

#### Testing Checklist
- [ ] Unit tests written with 90%+ coverage
- [ ] Integration tests cover all API endpoints
- [ ] Edge cases tested (zero, negative, overflow)
- [ ] Concurrent operation tests pass
- [ ] Idempotency tests pass
- [ ] Rate limiting tests pass
- [ ] Load tests meet performance requirements
- [ ] All tests pass in CI/CD pipeline

#### Documentation Checklist
- [ ] API endpoints documented with request/response examples
- [ ] Database schema changes documented
- [ ] Configuration parameters documented
- [ ] Update relevant specification documents
- [ ] Add migration scripts if schema changes
- [ ] Update CHANGELOG.md with notable changes

#### Performance Checklist
- [ ] Database queries optimized with EXPLAIN ANALYZE
- [ ] Appropriate indexes added
- [ ] N+1 query problems resolved
- [ ] Response times meet SLA requirements
- [ ] Memory usage profiled and acceptable
- [ ] No unnecessary database roundtrips

#### Compliance Checklist
- [ ] Age verification enforced (if applicable)
- [ ] Spending limits respected
- [ ] Terms of service acceptance required
- [ ] Jurisdictional restrictions enforced
- [ ] Audit trail complete and immutable
- [ ] GDPR/privacy requirements met

#### Non-Regression Checklist
- [ ] No modifications to existing balance calculation logic (or approved with tests)
- [ ] No deletion of transaction history records
- [ ] Idempotency guarantees maintained
- [ ] Race condition protections maintained
- [ ] Server-side validation not weakened

### Code Review Requirements
- [ ] At least one human reviewer approved
- [ ] Security review completed (for high-risk changes)
- [ ] Database schema changes reviewed by DBA
- [ ] Load testing results reviewed (for performance-critical changes)

### Deployment Checklist
- [ ] Feature flag configured (if applicable)
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] Database migrations tested
- [ ] Deployment runbook updated

---

## Escalation & Approval Process

### Standard Changes
- Changes that follow all rules and pass checklist → Standard review process

### High-Risk Changes
Require additional approval from:
- Backend Engineering Lead
- Security Engineer
- Product Owner

High-risk changes include:
- Modifications to core balance calculation
- Changes to transaction logging
- New token-based game features
- Changes to authentication/authorization
- Database schema changes affecting transactions
- Changes to RNG implementation

### Critical Changes
Require approval from ALL stakeholders:
- Backend Engineering Lead
- Security Engineer  
- Database Administrator
- Product Owner
- Legal/Compliance (if affects user funds or regulatory compliance)

Critical changes include:
- Removal or weakening of security controls
- Changes to audit logging or retention
- Modifications to idempotency logic
- Changes affecting money/token calculations

---

## Enforcement

### Automated Enforcement
- CI/CD pipeline runs all tests automatically
- Static analysis tools check for security issues
- Code coverage tools verify test requirements
- Database migration scripts run validation checks

### Manual Enforcement
- Code reviewers verify checklist completion
- Security team reviews high-risk changes
- DBA reviews schema changes
- Product owner verifies feature requirements

### Violations
- **Minor**: Non-blocking suggestions for improvement
- **Major**: Must be fixed before merge
- **Critical**: Immediate rejection, requires architectural review

---

## References

- [Slot Machine Specification](/docs/specs/SLOT_MACHINE_SPEC_v1.0.md)
- [Engineering Standards](/docs/governance/ENGINEERING_STANDARDS.md)
- [Security Audit Policy](/SECURITY_AUDIT_POLICY_AND_CHECKLIST.md)
- [AI Onboarding Guide](/AI_ONBOARDING.md)

---

## Document Control

- **Version**: 1.0
- **Status**: Authoritative
- **Created**: 2025-12-15
- **Last Updated**: 2025-12-15
- **Next Review**: Quarterly or upon major feature additions

---

## Questions or Clarifications

For questions about these rules:
- Technical: engineering-team@xxxchatnow.com
- Security: security-team@xxxchatnow.com
- Process: product-team@xxxchatnow.com
