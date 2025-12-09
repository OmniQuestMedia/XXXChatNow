# AI Onboarding Documentation

## Repository Overview

This repository contains XXXChatNow, a cam aggregator platform that integrates multiple affiliate cam services including xlovecam, stripcash, bongacam, and chaturbate.

**Version:** V1.0.3

## Project Structure

The repository is organized into three main components:

- **`api/`** - Provides RESTful APIs and manages application business logic
- **`user/`** - Website frontend for end users, models, and studios
- **`admin/`** - Management interface for administrators

## Development Setup

### API Component
1. Navigate to the `api` folder
2. Create `.env` file from `config-example/api.env`
3. Run `yarn` to install dependencies
4. Development: `yarn start:dev`
5. Production: `yarn build && yarn start`

### User Component
1. Navigate to the `user` folder
2. Create `.env` file from `config-example/user.env`
3. Run `yarn` to install dependencies
4. Development: `yarn dev`
5. Production: `yarn build && yarn start`

### Admin Component
1. Navigate to the `admin` folder
2. Create `.env` file from `config-example/admin.env`
3. Run `yarn` to install dependencies
4. Development: `yarn dev`
5. Production: `yarn build && yarn start`

## Key Features

- **Stream Goals**: Models can set goals that activate on all their streams
- **Ghost Mode**: Users can enable anonymous mode where display name shows as 'Anonymous'

## Technology Stack

- **Runtime:** Node.js
- **Package Manager:** Yarn
- **Environment Management:** .env files

## Contact Information

- **Sales:** contact@adent.io
- **Technical Support:** tuong.tran@outlook.com
- **General Contact:** contact@adent.io

## License

This is a private, commercial project that must be purchased and is not available as free software.

## Additional Documentation

- Check the project wiki for more detailed information
- Review `README.md` for change logs and feature updates
- See `SECURITY_AUDIT_POLICY_AND_CHECKLIST.md` for security guidelines

## AI Assistant Notes

When working with this codebase:
1. Always ensure environment variables are properly configured before running components
2. Use `yarn` as the package manager (not npm)
3. Respect the private/commercial nature of the codebase
4. Follow the existing project structure when adding new features
5. Test changes across all three components (api, user, admin) when applicable
