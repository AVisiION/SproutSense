# Deployment Guide - SproutSense

## Environment Separation

The application now has proper separation between development and production environments.

### Environment Files

#### Backend (`backend/`)
- `.env.development` - Development configuration (local MongoDB, permissive settings)
- `.env.production.example` - Production template (copy and fill with real values)
- `.env.example` - General template with all available options

#### Frontend (`web/`)
- `.env.development` - Development configuration (localhost:5000 API)
- `.env.production` - Production configuration (update with your backend URL)

### Setup Instructions

#### Development Mode

1. **Backend Setup:**
   ```bash
   cd backend
   npm install
   npm run dev  # Uses .env.development automatically
   ```

2. **Frontend Setup:**
   ```bash
   cd web
   npm install
   npm run dev  # Uses .env.development automatically
   ```

3. **Or use the automated script:**
   ```powershell
   .\start.ps1  # Starts both backend and frontend in dev mode
   ```

#### Production Deployment

##### Backend Production

1. **Create production environment file:**
   ```bash
   cd backend
   cp .env.production.example .env
   ```

2. **Edit `.env` and set:**
   - `NODE_ENV=production`
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `CORS_ORIGIN` - Your frontend production URL
   - `JWT_SECRET` - Strong random string
   - Other production values

3. **Start production server:**
   ```bash
   npm start  # or npm run start:prod
   ```

##### Frontend Production

1. **Update `web/.env.production`:**
   - Set `VITE_API_BASE_URL` to your backend URL
   - Set `VITE_WS_URL` to your WebSocket URL

2. **Build for production:**
   ```bash
   cd web
   npm run build
   ```

3. **Deploy the `dist/` folder to:**
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - Any static hosting service

##### Deploy to Render.com (Example)

1. **Backend:**
   - Create new Web Service
   - Connect your GitHub repo
   - Set root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm run start:prod`
   - Add environment variables from `.env.production.example`

2. **Frontend:**
   - Create new Static Site
   - Set root directory: `web`
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Add environment variables from `.env.production`

### Key Production Features

✅ **Security Enhancements:**
- Helmet.js with production-specific settings
- Stricter CORS policies
- Trust proxy for reverse proxies
- Requires JWT_SECRET in production

✅ **Test Mode Disabled:**
- Automatically disabled in production
- UI shows warning message
- Cannot be enabled via Settings in production

✅ **Optimized Logging:**
- Morgan uses 'combined' format in production
- Better for log aggregation services

✅ **Rate Limiting:**
- Default: 100 requests/15min in production
- 200 requests/15min in development

### Environment Variables

#### Backend Required (Production)
- `NODE_ENV=production`
- `MONGODB_URI` - MongoDB connection string
- `CORS_ORIGIN` - Frontend URL
- `JWT_SECRET` - Strong secret key

#### Frontend Required (Production)
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_WS_URL` - WebSocket URL
- `VITE_NODE_ENV=production`

### Testing Production Build Locally

```bash
# Backend
cd backend
NODE_ENV=production npm start

# Frontend
cd web
npm run build
npm run preview  # Test production build locally
```

### Troubleshooting

**Test mode not working in production:**
- This is expected behavior for security
- Test mode is automatically disabled in production
- Use real ESP32 hardware or switch to development mode

**CORS errors:**
- Verify `CORS_ORIGIN` in backend matches your frontend URL
- Check that the frontend is making requests to the correct backend URL

**Database connection issues:**
- Verify MongoDB Atlas allows connections from your server IP
- Check connection string format
- Ensure database user has proper permissions

### Security Checklist

- [ ] Change all default secrets (JWT_SECRET, etc.)
- [ ] Use MongoDB Atlas or secured database
- [ ] Enable HTTPS (required for production)
- [ ] Set proper CORS origins
- [ ] Review and adjust rate limits
- [ ] Never commit `.env` files with real credentials
- [ ] Use environment variables in deployment platform
- [ ] Enable database backups
- [ ] Set up monitoring and alerting

### Monitoring

Consider adding:
- [Sentry](https://sentry.io) for error tracking
- [New Relic](https://newrelic.com) for performance monitoring
- [MongoDB Atlas monitoring](https://www.mongodb.com/cloud/atlas) for database insights
- [LogRocket](https://logrocket.com) for frontend session replay

