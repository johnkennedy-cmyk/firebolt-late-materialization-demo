# Deployment Guide

This document provides instructions for deploying the Firebolt Late Materialization Demo.

## Local Development

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your Firebolt credentials to .env.local
# FIREBOLT_DATABASE=your_database_name
# FIREBOLT_ENGINE=your_engine_name
# FIREBOLT_CLIENT_ID=your_client_id
# FIREBOLT_CLIENT_SECRET=your_client_secret

# Run development server
npm run dev

# Open http://localhost:3000
```

## Production Deployment

### Option 1: Vercel (Recommended)

Vercel is the easiest deployment option for Next.js applications.

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-org/firebolt-late-materialization-demo.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables:
     - `FIREBOLT_DATABASE`
     - `FIREBOLT_ENGINE`
     - `FIREBOLT_CLIENT_ID`
     - `FIREBOLT_CLIENT_SECRET`
   - Click "Deploy"

3. **Automatic Deployments**
   - Every push to `main` triggers a new deployment
   - Preview deployments for pull requests

### Option 2: Docker

```dockerfile
# Create Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t firebolt-demo .
docker run -p 3000:3000 \
  -e FIREBOLT_DATABASE=your_database \
  -e FIREBOLT_ENGINE=your_engine \
  -e FIREBOLT_CLIENT_ID=your_client_id \
  -e FIREBOLT_CLIENT_SECRET=your_client_secret \
  firebolt-demo
```

### Option 3: Self-Hosted

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

3. **Use a process manager (PM2)**
   ```bash
   npm install -g pm2
   pm2 start npm --name "firebolt-demo" -- start
   pm2 save
   pm2 startup
   ```

4. **Set up reverse proxy (Nginx)**
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

## Environment Variables

### Required Variables

- `FIREBOLT_DATABASE`: Your Firebolt database name
- `FIREBOLT_ENGINE`: Your Firebolt engine name
- `FIREBOLT_CLIENT_ID`: Service account client ID
- `FIREBOLT_CLIENT_SECRET`: Service account client secret

### Optional Variables

- `FIREBOLT_ACCOUNT`: Account name (if using multi-account setup)
- `NODE_ENV`: Set to `production` for production builds

## Security Considerations

### Credential Management

1. **Never commit credentials**
   - Use environment variables
   - Add `.env*` to `.gitignore`

2. **Rotate credentials regularly**
   - Create new service accounts periodically
   - Revoke old credentials

3. **Minimize permissions**
   - Service accounts should have read-only access
   - Grant access only to necessary tables

### HTTPS

Always use HTTPS in production:

- Vercel provides automatic HTTPS
- For self-hosted, use Let's Encrypt:
  ```bash
  sudo certbot --nginx -d your-domain.com
  ```

### Rate Limiting

The demo includes basic rate limiting (50 requests/minute per IP). For production:

- Consider using a service like Cloudflare
- Implement Redis-based rate limiting for distributed deployments
- Add authentication for additional security

## Monitoring

### Vercel Analytics

Enable Vercel Analytics to track:
- Page views
- Performance metrics
- Error rates

### Custom Monitoring

Add monitoring tools:
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for user tracking

## Scaling

### Performance Optimization

1. **Enable caching**
   - Static assets are cached by default
   - Consider adding query result caching

2. **Optimize images**
   - Use Next.js Image component
   - Enable automatic image optimization

3. **Database connection pooling**
   - Reuse Firebolt connections
   - Implement connection pooling if needed

### Horizontal Scaling

For high traffic:
- Deploy multiple instances behind a load balancer
- Use Redis for shared session storage
- Implement distributed rate limiting

## Troubleshooting

### Build Failures

**Error: Module not found**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Error: TypeScript errors**
```bash
npx tsc --noEmit
# Fix any type errors shown
```

### Runtime Issues

**Error: Connection failed**
- Verify environment variables are set correctly
- Check service account permissions
- Ensure engine is running

**Error: Rate limit exceeded**
- Reduce request frequency
- Implement request queuing
- Contact support for higher limits

## Maintenance

### Updates

Keep dependencies up to date:
```bash
npm outdated
npm update
npm audit fix
```

### Backups

- Database credentials stored in environment variables
- Application code in version control
- No user data stored (stateless application)

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-org/firebolt-late-materialization-demo/issues
- Firebolt Docs: https://docs.firebolt.io
- Firebolt Support: support@firebolt.io

