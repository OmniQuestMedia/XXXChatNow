# COPILOT_GOVERNANCE.md

**XXXChatNow Repository-Specific Copilot Governance**

This document extends the organization-level Copilot governance policy defined in:
[OmniQuestMedia/Org-Policies/COPILOT_GOVERNANCE_ORG.md](https://github.com/OmniQuestMedia/Org-Policies/blob/main/COPILOT_GOVERNANCE_ORG.md)

---

## Section 1: Repository Summary

### Technology Stack
XXXChatNow is a **MERN stack** application consisting of:

- **MongoDB**: Database layer for persisting user data, transactions, and content
- **Express**: Web framework (embedded in NestJS and Next.js)
- **React**: Frontend UI library used in both user-facing and admin applications
- **Node.js**: Runtime environment for all application components

### Architecture Overview
The repository contains three main components:

1. **API** (`/api`): 
   - NestJS-based RESTful API backend
   - Handles business logic, authentication, and data management
   - Manages WebSocket connections for real-time chat and streaming
   - Version: 3.3.0

2. **User** (`/user`):
   - Next.js/React frontend for end users and models
   - Public-facing interface for live streaming and chat
   - Version: 3.3.0

3. **Admin** (`/admin`):
   - Next.js/React backend office application
   - Administrative dashboard for platform management
   - Version: 3.3.0

### Business Domain
XXXChatNow is an **adult live-streaming and chat platform** that:
- Aggregates cam services from multiple affiliate partners (xlovecam, stripcash, bongacam, chaturbate)
- Hosts independent models broadcasting worldwide
- Provides a contemporary, sex-positive platform built by models, for models and VIP users

### Integration Points
The platform integrates critical business systems:

- **Loyalty Systems**: User rewards, VIP tiers, and engagement tracking
- **Payment Processing**: Secure token purchases, model payouts, and financial transactions
- **Analytics**: User behavior tracking, performance metrics, and business intelligence
- **Real-time Streaming**: WebSocket-based live video and chat delivery
- **External Affiliate APIs**: Integration with third-party cam platforms

---

## Section 2: Extra Rules & Repository-Specific Requirements

### 2.1 Human Verification Requirements

#### Business Calculations
**ALL** changes involving business logic calculations **MUST** receive explicit human verification before merge:

- Token/credit calculations and balance adjustments
- Payment processing and gateway integrations
- Commission calculations for models and affiliates
- Pricing logic and promotional discounts
- Loyalty point calculations and tier thresholds
- Refund and chargeback processing
- Currency conversions and exchange rates

**Rationale**: Financial miscalculations can result in monetary loss, legal liability, and loss of user trust. All financial code must be reviewed by engineers with domain authority.

#### Explicit API Calls
Changes that introduce or modify external API calls require human review:

- Payment gateway APIs (tokenization, charges, payouts)
- Affiliate platform APIs (streaming endpoints, user data)
- Analytics and tracking services
- Email/SMS notification services
- Identity verification services
- Cloud storage and CDN interactions

**Rationale**: External API calls may expose sensitive data, incur costs, or create security vulnerabilities. All external communication must be audited.

### 2.2 React & UX Conventions

#### Component Standards
- Use functional components with React Hooks (avoid class components)
- Implement proper PropTypes or TypeScript interfaces for all components
- Follow component composition patterns; keep components focused and reusable
- Use Redux Toolkit for state management (already established in codebase)
- Implement proper error boundaries for graceful failure handling

#### User Experience Guidelines
- Maintain responsive design across mobile, tablet, and desktop
- Preserve existing accessibility features (ARIA labels, keyboard navigation)
- Ensure loading states and error messages are user-friendly
- Maintain consistency with existing UI/UX patterns (Ant Design components)
- Test all UI changes across different screen sizes and browsers

#### Performance Considerations
- Implement code splitting and lazy loading for optimal bundle sizes
- Use React.memo() and useMemo() to prevent unnecessary re-renders
- Optimize images and media assets
- Minimize API calls; implement proper caching strategies

### 2.3 Adult Content Safeguards

Given the adult nature of this platform, special safeguards apply:

#### Sensitive Content Changes
Changes affecting adult content handling, age verification, or compliance features require:
- **Owner approval** from repository maintainer
- **Security reviewer approval** from designated security team member
- **Legal review** if changes impact terms of service, age gates, or content policies

#### Protected Areas
The following areas are considered highly sensitive and require enhanced review:

- Age verification systems and logic
- Content moderation and filtering
- User authentication and identity verification
- Privacy controls and user data handling
- Compliance with adult content regulations (e.g., 18 U.S.C. 2257)
- Model verification and onboarding processes
- Payment processing for adult services

#### Content Safety Requirements
- Never bypass age verification checks
- Maintain strict separation between adult and non-adult content areas
- Implement proper content warnings and user consent flows
- Ensure all logs and error messages avoid exposing explicit content descriptions
- Follow platform policies for prohibited content types

### 2.4 Security Requirements
All changes must comply with the security policies defined in:
- `SECURITY_AUDIT_POLICY_AND_CHECKLIST.md`
- `AI_ONBOARDING.md`

Key requirements:
- No master passwords, backdoors, or authentication bypasses
- No secrets or credentials in code
- Input validation on all endpoints
- Rate limiting on sensitive operations
- Proper authorization checks for all API endpoints
- Audit logging for administrative actions

---

## Section 3: Required Documentation

The following governance and onboarding documents **MUST** be maintained and kept current:

### 3.1 Governance Documents
- **COPILOT_GOVERNANCE.md** (this file): Repository-specific Copilot rules and conventions
- **COPILOT_REPO_BRIEFING.md**: Detailed technical briefing for AI assistants
  - Status: To be created as needed
  - Owner: Repository maintainers
  - Purpose: Provide detailed technical context for AI assistants working on complex features
- **COPILOT_PR_CHECKLIST.md**: Pull request checklist for AI-assisted changes
  - Status: To be created as needed
  - Owner: Repository maintainers
  - Purpose: Standardize PR review process for AI-generated changes

### 3.2 Security & Policy Documents
- **SECURITY_AUDIT_POLICY_AND_CHECKLIST.md**: Security requirements and audit procedures
- **AI_ONBOARDING.md**: AI assistant integration guidelines and workflows

### 3.3 Documentation Maintenance
- Documents must be updated when significant architectural changes occur
- Security policies must be reviewed quarterly or after security incidents
- AI governance documents must be reviewed after any policy violations or incidents
- All document updates require human review and approval

---

## Section 4: Workflow & Review Requirements

### 4.1 AI-Generated Pull Requests
All PRs created by AI assistants must:
- Include clear commit messages referencing the task/issue
- Link to the originating issue or feature request
- Pass all automated CI checks (linting, tests, security scans)
- Require at least **one human reviewer** for approval
- Include a checklist covering the key review areas outlined in Section 2 (when `COPILOT_PR_CHECKLIST.md` is available, use that template)

### 4.2 Elevated Review Requirements
The following changes require **two human reviewers**, including at least one with domain expertise:
- Payment or financial transaction code
- Authentication or authorization logic
- Age verification or compliance features
- Database migration scripts
- External API integrations
- Security-sensitive configurations

### 4.3 Prohibited AI Actions
AI assistants **MUST NOT**:
- Merge their own pull requests
- Override or bypass security checks
- Commit secrets, credentials, or API keys
- Make changes to production configuration without human approval
- Modify audit logging or security monitoring code without explicit authorization
- Remove or weaken existing security controls

---

## Section 5: Compliance & Enforcement

### 5.1 Policy Violations
Violations of this governance policy include:
- Merged PRs that bypass required human review
- Changes to financial code without domain expert approval
- Security vulnerabilities introduced without immediate remediation
- Committed secrets or credentials
- Disabled or weakened security controls

### 5.2 Incident Response
When policy violations occur:
1. Immediately revert the offending changes
2. Notify repository owner and security team
3. Conduct root cause analysis
4. Update governance policies to prevent recurrence
5. Document incident in `DECISIONS.md` or changelog

### 5.3 Continuous Improvement
This governance document is subject to continuous improvement:
- Quarterly reviews by repository maintainers
- Updates based on incident learnings
- Incorporation of new security best practices
- Alignment with evolving organizational policies

---

## Appendix: Quick Reference

### Critical Areas Requiring Human Review
✅ **Always require human review:**
- Financial calculations (tokens, payments, commissions)
- External API calls (payment gateways, affiliates, analytics)
- Age verification and compliance features
- Authentication and authorization changes
- Adult content handling and moderation
- Database migrations
- Security-sensitive configurations

### Safe for AI Assistance
✅ **AI can suggest with standard review:**
- Documentation updates
- Test case additions
- Code formatting and linting fixes
- Non-financial bug fixes
- UI/UX improvements (non-security-related)
- Logging and monitoring enhancements (non-security-related)

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-11  
**Owner**: Repository Maintainers  
**Review Schedule**: Quarterly or after incidents
