# GitHub Pages Setup Guide

This document provides instructions for enabling GitHub Pages deployment for the Agile Story Builder application.

## Prerequisites

- Repository owner or admin access to the GitHub repository
- GitHub Pages enabled for your account/organization

## Setup Steps

### 1. Enable GitHub Pages in Repository Settings

1. Navigate to your repository on GitHub: `https://github.com/<your-username>/kipling-v2`
2. Click on **Settings** tab
3. In the left sidebar, under "Code and automation", click **Pages**
4. Under "Build and deployment":
   - **Source**: Select **GitHub Actions** from the dropdown
5. Save the changes

### 2. Automatic Deployment

Once GitHub Pages is configured:

- Every push to the `main` branch will automatically trigger a deployment
- The GitHub Actions workflow (`.github/workflows/deploy.yml`) will:
  1. Install dependencies
  2. Build the application
  3. Deploy to GitHub Pages

### 3. View Your Deployed Site

After the first deployment completes (usually 2-5 minutes):

- Your site will be available at: `https://<your-username>.github.io/kipling-v2/`
- You can check deployment status in the **Actions** tab of your repository

## Manual Deployment (Optional)

You can also trigger a manual deployment:

1. Go to the **Actions** tab in your repository
2. Select the "Deploy to GitHub Pages" workflow
3. Click **Run workflow** button
4. Select the branch (usually `main`) and click **Run workflow**

## Configuration Details

### Vite Configuration

The `vite.config.js` has been configured with the correct base path:

```javascript
base: '/kipling-v2/',
```

This ensures all assets (JavaScript, CSS, images) are loaded from the correct path when deployed to GitHub Pages.

### GitHub Actions Workflow

The deployment workflow (`.github/workflows/deploy.yml`) includes:

- **Trigger**: Runs on push to `main` branch or manual trigger
- **Build**: Uses Node.js 20, installs dependencies, and builds the app
- **Deploy**: Uploads the `dist` folder to GitHub Pages

### Permissions

The workflow requires these permissions:
- `contents: read` - to checkout the repository
- `pages: write` - to deploy to GitHub Pages
- `id-token: write` - for authentication

## Troubleshooting

### Deployment Fails

1. Check the **Actions** tab for error logs
2. Ensure all tests pass locally with `npm test`
3. Verify the build succeeds locally with `npm run build`

### Site Shows 404 or Blank Page

1. Verify the base path in `vite.config.js` matches your repository name
2. Clear your browser cache and try again
3. Check the browser console for any loading errors

### Assets Not Loading

1. Verify the `base` path in `vite.config.js` is correct
2. Check that the deployed files in the Pages deployment include the assets folder
3. Ensure the workflow is uploading the correct `dist` folder

## Custom Domain (Optional)

To use a custom domain:

1. Go to repository **Settings** → **Pages**
2. Under "Custom domain", enter your domain name
3. Follow GitHub's instructions to configure DNS
4. Update `vite.config.js` to use `base: '/'` instead of `base: '/kipling-v2/'`

## Local Development

The configuration does not affect local development:

```bash
npm run dev  # Still runs on http://localhost:5173
```

The base path only applies to production builds.
