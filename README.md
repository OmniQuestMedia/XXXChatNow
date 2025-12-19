# XXXChatNow

XXXChatNow is a comprehensive adult video chat platform consisting of three main components:

## Components

### 1. API (`/api`)
The backend API kernel for XXXChatNow, built with NestJS. This handles all business logic, database operations, and provides RESTful APIs for the frontend applications.

**Tech Stack:**
- NestJS (Node.js framework)
- TypeScript
- PostgreSQL
- Redis

**Getting Started:**
```bash
cd api
yarn install
# Copy env.sample to .env and configure
yarn dev
```

See [api/README.md](api/README.md) for detailed API documentation.

### 2. Admin Panel (`/admin`)
The management website for administrators to oversee platform operations, manage users, monitor activities, and configure system settings.

**Tech Stack:**
- Next.js
- React
- Ant Design
- TypeScript

**Getting Started:**
```bash
cd admin
yarn install
# Copy env.example to .env and configure
yarn dev
```

### 3. User Website (`/user`)
The main website for end users, models, and studios to interact, stream, and engage with the platform.

**Tech Stack:**
- Next.js
- React
- Ant Design
- TypeScript

**Getting Started:**
```bash
cd user
yarn install
# Copy env.example to .env and configure
yarn dev
```

## Configuration

Example configuration files are provided in the `/config-example` directory, including:
- Environment configuration templates
- Nginx configuration examples

Copy and modify these files according to your deployment environment.

## Development Setup

1. **Prerequisites:**
   - Node.js 14+ and Yarn
   - PostgreSQL 12+
   - Redis

2. **Clone the repository:**
   ```bash
   git clone https://github.com/OmniQuestMedia/XXXChatNow.git
   cd XXXChatNow
   ```

3. **Set up each component:**
   Follow the Getting Started instructions for each component (API, Admin, User) as listed above.

4. **Database Setup:**
   - Create a PostgreSQL database
   - Run migrations from the API component

## Project Structure

```
XXXChatNow/
├── api/              # Backend API (NestJS)
├── admin/            # Admin panel (Next.js)
├── user/             # User website (Next.js)
├── config-example/   # Configuration templates
└── README.md         # This file
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and contribution process.

## Security

For security policies and audit requirements, see [SECURITY_AUDIT_POLICY_AND_CHECKLIST.md](SECURITY_AUDIT_POLICY_AND_CHECKLIST.md).

## License

UNLICENSED - Proprietary software for OmniQuestMedia Inc.

## Contact

- **Sales**: general@OQMINC.com
- **Technical**: tuong.tran@outlook.com
- **Organization**: OmniQuestMedia Inc. (OQMI)
