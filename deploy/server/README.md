# Digital Year Book Backend Server

## Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MySQL credentials
npm run dev
```

## API Endpoints

- `GET /` - API health check
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user (protected)
- `GET /api/admin/*` - Admin routes (protected, requires admin role)