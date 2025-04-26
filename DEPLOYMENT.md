# Deploying Merchant Yapp

This guide explains how to deploy the Merchant Yapp application using various platforms and methods.

## Prerequisites

1. Git repository with your Merchant Yapp code
2. Environment variables configured (copy from `.env.example` to `.env`)
3. Node.js installed on your local machine (for local development and builds)

## Deployment Options

### A. Docker Deployment

Docker provides a consistent deployment environment across different platforms.

#### 1. Using docker-compose (Recommended)

The included `docker-compose.yml` file makes it easy to deploy the application:

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

Environment variables can be configured in the `docker-compose.yml` file or by creating a `.env` file.

#### 2. Using Docker directly

```bash
# Build the Docker image
docker build -t merchant-yapp .

# Run the container
docker run -d -p 8080:80 --name merchant-yapp merchant-yapp

# With environment variables
docker run -d -p 8080:80 \
  -e VITE_ADMIN_CONFIG='{"admins":[{"ens":"your.ens","address":"0x123..."}]}' \
  -e VITE_SHOP_CONFIG='{"shops":[{"name":"Your Shop"}],"products":[...]}' \
  -e VITE_WALLET_CONNECT_PROJECT_ID='your_project_id' \
  --name merchant-yapp merchant-yapp

# Stop the container
docker stop merchant-yapp

# Remove the container
docker rm merchant-yapp
```

#### 3. Deploying with Coolify

[Coolify](https://coolify.io/) is an open-source self-hosted platform for deploying applications.

1. Install Coolify on your server following the [official documentation](https://docs.coolify.io/installation)

2. Add your Git repository to Coolify:
   - Go to Resources → Create Resource → Application
   - Select your Git provider and repository
   - Choose "Docker" as deployment method

3. Configure the build:
   - Set the repository branch (e.g., `main`)
   - Docker Configuration:
     - Path to Dockerfile: `./Dockerfile`
     - Docker Compose: Toggle on if you want to use docker-compose.yml
     - Container Port: `80`
     - Published Port: `8080` (or your preferred port)

4. Configure environment variables:
   - Add your environment variables from `.env.example`
   - Make sure to set `VITE_ADMIN_CONFIG`, `VITE_SHOP_CONFIG`, and `VITE_WALLET_CONNECT_PROJECT_ID`

5. Deploy the application

#### 4. Other Docker PaaS Options

You can deploy the Docker container to various platforms:

- **DigitalOcean App Platform**:
  ```bash
  # Install doctl
  brew install doctl  # macOS
  
  # Authenticate
  doctl auth init
  
  # Create app
  doctl apps create --spec app-spec.yaml
  ```

- **Google Cloud Run**:
  ```bash
  # Build and push to Google Container Registry
  gcloud builds submit --tag gcr.io/PROJECT_ID/merchant-yapp
  
  # Deploy to Cloud Run
  gcloud run deploy merchant-yapp --image gcr.io/PROJECT_ID/merchant-yapp --platform managed
  ```

- **AWS Elastic Container Service (ECS)**:
  ```bash
  # Push to Amazon ECR
  aws ecr get-login-password | docker login --username AWS --password-stdin aws_account_id.dkr.ecr.region.amazonaws.com
  docker tag merchant-yapp:latest aws_account_id.dkr.ecr.region.amazonaws.com/merchant-yapp:latest
  docker push aws_account_id.dkr.ecr.region.amazonaws.com/merchant-yapp:latest
  
  # Deploy using CloudFormation or ECS CLI
  ```

### B. Vercel Deployment

Vercel is ideal for frontend applications and provides a great developer experience.

#### 1. Deploy via the Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and log in
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Configure the project:
   - Framework Preset: Vite
   - Build Command: `npm run build` (default)
   - Output Directory: `dist` (default)
5. Add Environment Variables:
   - Add the variables from your `.env` file
6. Click "Deploy"

#### 2. Deploy via Vercel CLI

   ```bash
# Install the Vercel CLI
   npm install -g vercel

# Log in to Vercel
vercel login

# Deploy from your project directory
vercel

# For a production deployment
vercel --prod
```

### C. Netlify Deployment

Netlify is another excellent platform for frontend applications.

#### 1. Deploy via the Netlify Dashboard

1. Go to [netlify.com](https://netlify.com) and log in
2. Click "Add new site" → "Import an existing project"
3. Connect to your Git provider and select your repository
4. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add environment variables in the "Environment" section
6. Click "Deploy site"

#### 2. Deploy via Netlify CLI

   ```bash
# Install the Netlify CLI
npm install -g netlify-cli

# Log in to Netlify
netlify login

# Initialize Netlify site configuration
netlify init

# Deploy the site
netlify deploy

# For production deployment
netlify deploy --prod
```

## Environment Variables

The application uses the following environment variables:

- `VITE_ADMIN_CONFIG`: JSON string containing admin wallet information
- `VITE_SHOP_CONFIG`: JSON string containing shop and product information
- `VITE_WALLETCONNECT_PROJECT_ID`: Your WalletConnect project ID (get from [WalletConnect Cloud](https://cloud.walletconnect.com/))
- `VITE_BASE_URL`: Base URL for production deployments (optional)
- `VITE_TEMPO`: Feature flag for enabling Tempo devtools (optional)

### Security Best Practices

1. **Never commit environment files with real credentials to your repository**
   - Only commit the `.env.example` file as a template
   - Keep `.env` and `.env.production` in your `.gitignore` file (already configured)

2. **Setting up environment variables**:
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit with your actual values
   nano .env
   ```

3. **For production deployments**:
   - Set environment variables through your deployment platform's UI/CLI
   - For Docker, pass them via environment flags or mount as secrets
   - For CI/CD pipelines, use secrets management as shown in the GitHub Actions example

Refer to `.env.example` for the format of these variables.

## Continuous Integration and Deployment

### GitHub Actions

Create a `.github/workflows/deploy.yml` file for automatic deployments:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_ADMIN_CONFIG: ${{ secrets.VITE_ADMIN_CONFIG }}
          VITE_SHOP_CONFIG: ${{ secrets.VITE_SHOP_CONFIG }}
          VITE_WALLET_CONNECT_PROJECT_ID: ${{ secrets.VITE_WALLET_CONNECT_PROJECT_ID }}
      
      # Deploy to your preferred platform
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Troubleshooting

### 1. Content Security Policy (CSP) Issues

If you encounter frame embedding issues:

- Check that your `vercel.json` or `nginx.conf` includes the proper CSP headers
- For Netlify, ensure your `public/_headers` file contains the proper headers

### 2. Environment Variable Issues

- Verify that all environment variables are correctly set
- Docker: Check that environment variables are passed correctly to the container
- Vercel/Netlify: Check that environment variables are set in the dashboard

### 3. Build Failures

- Make sure your Node.js version is compatible (v16+)
- Check that all dependencies are installed correctly
- Verify that the build script in package.json is correct

## Best Practices

1. **Security**:
   - Never commit sensitive information to your Git repository
   - Use environment variables for sensitive data
   - Keep the `.env` file in `.gitignore`

2. **Performance**:
   - Use a CDN for static assets
   - Enable HTTP/2 in your web server
   - Configure proper caching headers

3. **Monitoring**:
   - Set up health checks
   - Monitor server load and response times
   - Configure logging for easier debugging 