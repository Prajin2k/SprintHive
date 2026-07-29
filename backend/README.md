# Sprint Hive — Backend

> Production-grade Express.js API for Sprint Hive SaaS Project Management Platform

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)

### Setup

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your values

# Start development server
npm run dev
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 5000) |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `JWT_ACCESS_SECRET` | **Yes** | JWT access token secret |
| `JWT_REFRESH_SECRET` | **Yes** | JWT refresh token secret |
| `JWT_ACCESS_EXPIRES_IN` | No | Access token TTL (default: 15m) |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh token TTL (default: 7d) |
| `CLIENT_URL` | No | Frontend URL for CORS (default: http://localhost:5173) |
| `EMAIL_HOST` | No | SMTP host |
| `EMAIL_PORT` | No | SMTP port |
| `EMAIL_USER` | No | SMTP username |
| `EMAIL_PASS` | No | SMTP password/app-password |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |

> **Note:** Email and Cloudinary are optional — the server will log a warning and skip those features in dev mode.

### Health Check

```
GET http://localhost:5000/api/health
```

## Project Structure

```
backend/
├── config/         # DB connection, env config
├── controllers/    # Route handler logic
├── middlewares/    # auth, upload, validation
├── models/         # Mongoose schemas
├── routes/         # Express routers
├── services/       # Business logic (email, upload, PDF)
├── socket/         # Socket.io event handlers
├── utils/          # Helpers (AppError, asyncHandler)
├── uploads/        # Local file storage fallback
└── server.js       # Entry point
```
