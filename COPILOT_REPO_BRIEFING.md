# COPILOT_REPO_BRIEFING.md

**Owner:** OmniQuestMedia  
**Last Updated:** 2025-12-11  
**Governance Profile:** B – Nimble guardrails, fast iteration  
**Applies to:** xxxchatnow, redroomrewards

---

## Purpose

This document defines how GitHub Copilot and AI assistants should operate within the XXXChatNow and RedRoomRewards repositories. It establishes lightweight guardrails that enable fast iteration while maintaining security, quality, and consistency.

**Governance Profile B** emphasizes:
- **Nimble guardrails**: Essential security and quality checks without excessive process
- **Fast iteration**: Quick feedback loops and rapid development cycles
- **Pragmatic approach**: Balance between automation and human oversight

---

## Workflow Expectations

### Development Flow
1. **Branch Creation**: Create feature branches with descriptive names (e.g., `feature/slot-machine`, `fix/payment-bug`, `copilot/update-docs`)
2. **Incremental Changes**: Make small, focused commits that are easy to review
3. **Pull Requests**: Open PRs early for feedback; include clear descriptions and context
4. **Review Process**: At least one human reviewer required for merge
5. **CI/CD**: All automated checks must pass before merge

### Copilot/AI Assistant Role
- **Suggest and Draft**: Generate code, documentation, tests, and configuration
- **Automate Repetitive Tasks**: Handle boilerplate, formatting, and routine edits
- **Assist with Triage**: Help identify issues, suggest fixes, and prioritize work
- **Never Merge Directly**: All AI-generated changes require human review and approval

---

## Use of Copilot

### What Copilot Can Do
- Generate code suggestions and completions
- Draft documentation and comments
- Create tests and test fixtures
- Refactor and modernize code
- Suggest security improvements
- Automate formatting and linting fixes
- Help with API integration and configuration

### What Requires Human Review
- All code changes before merge
- Security-sensitive operations (auth, payments, data handling)
- Database migrations and schema changes
- Configuration changes affecting production
- Dependency updates and version bumps
- Any changes to financial or transaction logic

### Copilot Workflow
1. Create a feature branch for Copilot work
2. Generate code/docs using AI assistance
3. Self-review and test locally
4. Open PR with clear description of AI-generated changes
5. Request human review
6. Address feedback and iterate
7. Merge after approval and passing checks

---

## Security & Privacy

### Security Guardrails
- **No Secrets in Code**: Never commit API keys, passwords, tokens, or credentials
- **No Backdoors**: No master passwords, magic strings, or authentication bypasses
- **Input Validation**: All user input must be validated and sanitized
- **Rate Limiting**: Apply rate limits to auth, payments, and sensitive operations
- **HTTPS Only**: All production traffic must use TLS/HTTPS
- **Secure Dependencies**: Scan for vulnerabilities before adding dependencies

### Privacy Requirements
- **PII Protection**: Never log names, emails, phone numbers, or payment details
- **Data Minimization**: Only collect and store necessary user data
- **No Unauthorized Telemetry**: No hidden analytics or tracking without disclosure
- **User Data Control**: Users must be able to view, export, and delete their data

### Audit Trail
- All Copilot commits must include clear authorship attribution
- Security-sensitive changes require additional review
- Maintain audit logs for authentication and financial operations

---

## Coding Style

### General Principles
- **Consistency**: Follow existing patterns in the codebase
- **Readability**: Write self-documenting code; add comments for complex logic
- **Simplicity**: Prefer simple solutions over clever ones
- **DRY**: Don't Repeat Yourself – extract reusable functions and components

### Language-Specific Guidelines

#### JavaScript/TypeScript (API, User, Admin)
- Use modern ES6+ syntax
- Prefer `const` over `let`; avoid `var`
- Use async/await over raw promises
- Follow existing ESLint configuration
- Use TypeScript types where applicable
- Add JSDoc comments for public APIs

#### Code Organization
- Keep files focused and under 300 lines where possible
- Group related functionality into modules
- Use clear, descriptive names for variables and functions
- Follow the existing folder structure (`api/`, `user/`, `admin/`)

#### Error Handling
- Always handle errors gracefully
- Log errors with sufficient context for debugging
- Never expose internal errors to end users
- Use try/catch blocks for async operations

---

## Branching Conventions

### Branch Naming
- `feature/<description>` – New features
- `fix/<description>` – Bug fixes
- `copilot/<description>` – AI-generated changes
- `security/<description>` – Security fixes
- `docs/<description>` – Documentation updates
- `refactor/<description>` – Code refactoring

### Branch Lifecycle
1. Create branch from `main` (or current development branch)
2. Make focused changes
3. Keep branch up to date with target branch
4. Open PR when ready for review
5. Merge after approval (no force push after review starts)
6. Delete branch after merge

### Commit Messages
- Use clear, descriptive commit messages
- Start with a verb: "Add", "Fix", "Update", "Remove", "Refactor"
- Reference issues/tickets when applicable
- Format: `<type>: <description> – <context/ticket>`
- Example: `fix: resolve payment timeout issue – relates to ISSUE-123`

---

## Repo-Specific Notes

### Project Structure
- **`api/`**: Backend REST API (Node.js/Express)
- **`user/`**: User-facing frontend (Next.js/React)
- **`admin/`**: Admin dashboard (Next.js/React)
- **`config-example/`**: Environment configuration templates

### Key Technologies
- **Backend**: Node.js, Express, TypeScript
- **Frontend**: Next.js, React, TypeScript
- **Database**: MongoDB (implied from structure)
- **Package Manager**: Yarn

### Setup & Development
- Copy `.env` from `config-example/` for each component
- Run `yarn` to install dependencies
- Use `yarn dev` for development, `yarn build && yarn start` for production
- Each component (api, user, admin) runs independently

### Special Considerations
- **XXXChatNow**: Adult content platform – ensure age verification and compliance
- **Multi-Service**: Aggregates multiple cam services (xlovecam, stripcash, bongacam, chaturbate)
- **Payment Sensitive**: Handles financial transactions – extra care required
- **PII Handling**: Manages user data, model information, and streaming content

---

## Developer Checklist

### Before Starting Work
- [ ] Pull latest changes from main branch
- [ ] Create feature branch with descriptive name
- [ ] Understand the issue/requirement fully
- [ ] Review related code and documentation

### During Development
- [ ] Follow coding style guidelines
- [ ] Write tests for new functionality
- [ ] Run linters and fix issues (`yarn lint`)
- [ ] Test locally before committing
- [ ] Commit incrementally with clear messages
- [ ] Keep commits small and focused

### Before Opening PR
- [ ] Run full test suite if available
- [ ] Build all components successfully
- [ ] Review your own changes
- [ ] Update documentation if needed
- [ ] Check for security issues
- [ ] Verify no secrets or credentials in code
- [ ] Write clear PR description with context

### During Review
- [ ] Respond to feedback promptly
- [ ] Make requested changes
- [ ] Keep PR scope focused – avoid feature creep
- [ ] Ensure CI checks pass

### After Merge
- [ ] Delete feature branch
- [ ] Verify changes in target environment
- [ ] Update issue/ticket status
- [ ] Monitor for issues post-deployment

---

## Update Rules

### When to Update This Document
- New security requirements or guardrails are established
- Workflow processes change significantly
- New tools or technologies are adopted
- Governance profile changes
- Feedback indicates confusion or gaps in guidance

### How to Update
1. Create branch: `docs/update-copilot-briefing`
2. Make changes to COPILOT_REPO_BRIEFING.md
3. Update "Last Updated" date
4. Open PR with clear rationale for changes
5. Request review from repository owner/maintainer
6. Merge after approval

### Document Owner
- **Primary Owner**: OmniQuestMedia team
- **Reviewers**: Repository maintainers and senior developers
- **Updates**: Reviewed quarterly or as needed

---

## Additional Resources

- [AI_ONBOARDING.md](./AI_ONBOARDING.md) – Detailed AI assistant integration guide
- [SECURITY_AUDIT_POLICY_AND_CHECKLIST.md](./SECURITY_AUDIT_POLICY_AND_CHECKLIST.md) – Security policies and audit checklist
- [README.md](./README.md) – Project overview and setup instructions

---

**End of Document**
