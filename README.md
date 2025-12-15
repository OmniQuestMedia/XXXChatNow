### Overview
XXXChatNow.com is cam aggregator base platform with affiliate cam services from xlovecam, stripcash, bongacam, chaturbate, as well as its own models broadcasting worldwide through a contemporay platform.

### Version
V1.0.3

### License
XXXChatNow is a privately developed platform - built by models, for models and an savvy sex-positive VIP user.

## Documentation

**All developers, GitHub Copilot, and contributors must follow the authoritative documentation and standards:**

- **[Copilot Engineering Rules](/docs/copilot/COPILOT.md)** - Mandatory rules for all token-based feature development, including non-regression rules and PR checklists
- **[Engineering Standards](/docs/governance/ENGINEERING_STANDARDS.md)** - Cross-cutting governance for all token-based features including documentation, testing, performance, and security standards
- **[Slot Machine Specification](/docs/specs/SLOT_MACHINE_SPEC_v1.0.md)** - Detailed technical specification for the slot machine feature with server-authoritative token mechanics
- **[Security Audit Policy](/SECURITY_AUDIT_POLICY_AND_CHECKLIST.md)** - Security requirements and audit checklist
- **[AI Onboarding Guide](/AI_ONBOARDING.md)** - Guidelines for AI assistant integration

**These documents are authoritative and must be followed for all future feature and PR work involving tokens, promotions, chip menu, slot machine, and related financial operations.**

## Structure

- `api`: provides application restful apis, and manage application business
- `user`: the website is for end users, models, and select, ethical studios to acccess.
- `admin`: the management website is for administrators
- `docs`: authoritative documentation for features, specifications, and governance

### Contact
- Email: general@OQMINC.com
### Author

- Sales: general@OQMINC.com
- Technical: tuong.tran@outlook.com

## Setup

### API

1. Go to api folder, create .env file from `config-example > api.env`
2. Replace with our configuration
3. Run `yarn` to install dependecies. Your `NODE_ENV` should be empty to `development` to install both dependencies and devDependencies
4. Run `yarn start:dev` for dev env or `yarn build && yarn start` from prod env

### User

1. Go to user folder, create .env file from `config-example > user.env`
2. Replace with our configuration
3. Run `yarn` to install dependecies. Your `NODE_ENV` should be empty to `development` to install both dependencies and devDependencies
4. Run `yarn dev` for dev env or `yarn build && yarn start` from prod env

### Admin

1. Go to admin folder, create .env file from `config-example > admin.env`
2. Replace with our configuration
3. Run `yarn` to install dependecies. Your `NODE_ENV` should be empty to `development` to install both dependencies and devDependencies
4. Run `yarn dev` for dev env or `yarn build && yarn start` from prod env

## Change logs

## Stream Goals
1. Settings: Models can set goals that will be activated on all their streams in `live page`.
The celebratory actions and number of milestones can be altered during a stream as well.
2. Goal Window: Goals can be checked below the stream window, in an expandable space.
Only the next goal and the reward associated shows up in the visible space; others show in the expanded view.
3. Promoting Goals: broadcast goals get published in the chat room at the beginning of a stream as well as when a new user joins.
Once a milestone is reached, the same will get published in chat as well.

- Check our `wiki`

### Features

- 21/08/2021. Add ghost mode feature
- description: When the user turns on ghost mode in the edit profile page, the display name will be 'Anonymous'
