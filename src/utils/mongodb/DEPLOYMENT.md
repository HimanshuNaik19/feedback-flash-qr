
# MongoDB Backend API Deployment Guide

This guide provides instructions for deploying your MongoDB backend API to various platforms.

## Prerequisites

1. Node.js and npm installed on your development machine
2. A MongoDB Atlas account with a cluster set up
3. Your MongoDB connection string in the format:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```

## Option 1: Deploy to Vercel (Recommended)

Vercel is a cloud platform for static sites and serverless functions that's easy to set up.

### Steps:

1. **Prepare your backend code**
   - Create a new folder for your backend project
   - Initialize a new Node.js project: `npm init -y`
   - Install dependencies: `npm install express mongodb cors dotenv`
   - Create an `api` folder for serverless functions

2. **Create your API route handler**
   - Create a file `api/mongodb.js` (for serverless function)
   - Copy the Express.js example from BACKEND_SETUP.md and adapt it for serverless

3. **Add a vercel.json configuration**
   ```json
   {
     "version": 2,
     "builds": [
       { "src": "api/*.js", "use": "@vercel/node" }
     ],
     "routes": [
       { "src": "/api/(.*)", "dest": "/api/mongodb.js" }
     ]
   }
   ```

4. **Set up environment variables**
   - Create a `.env.local` file for local development
   - Add your MongoDB connection string: `MONGODB_URI=mongodb+srv://...`

5. **Deploy to Vercel**
   - Install Vercel CLI: `npm i -g vercel`
   - Run: `vercel` and follow the prompts
   - Set the environment variables in the Vercel dashboard

6. **Update your frontend configuration**
   - Change the `API_BASE_URL` in `src/utils/mongodb/config.ts` to your Vercel deployment URL

## Option 2: Deploy to Heroku

Heroku is a platform as a service (PaaS) that enables developers to build, run, and operate applications entirely in the cloud.

### Steps:

1. **Prepare your backend code**
   - Create a new folder for your backend project
   - Initialize a new Node.js project: `npm init -y`
   - Install dependencies: `npm install express mongodb cors dotenv`
   - Create a `server.js` file with your Express.js code
   - Create a `Procfile` with: `web: node server.js`

2. **Set up Heroku**
   - Create a Heroku account if you don't have one
   - Install the Heroku CLI: `npm install -g heroku`
   - Login to Heroku: `heroku login`

3. **Create and deploy your app**
   - Create a new Heroku app: `heroku create your-app-name`
   - Add MongoDB URI config: `heroku config:set MONGODB_URI="mongodb+srv://..."`
   - Deploy: `git push heroku main`

4. **Update your frontend configuration**
   - Change the `API_BASE_URL` in `src/utils/mongodb/config.ts` to your Heroku app URL

## Option 3: Deploy to Render

Render is a unified platform to build and run all your apps and websites with free SSL, a global CDN, private networks, and auto-deploys from Git.

### Steps:

1. **Prepare your backend code**
   - Create a new GitHub repository for your backend
   - Add your Express.js code and dependencies

2. **Set up Render**
   - Create a Render account
   - Create a new Web Service
   - Connect your GitHub repository
   - Set the build command: `npm install`
   - Set the start command: `node server.js`
   - Add environment variable: `MONGODB_URI=mongodb+srv://...`

3. **Update your frontend configuration**
   - Change the `API_BASE_URL` in `src/utils/mongodb/config.ts` to your Render deployment URL

## Security Best Practices

1. **Environment Variables**
   - Never commit your MongoDB connection string to your repository
   - Always use environment variables for sensitive information

2. **API Authentication**
   - Consider adding authentication to your API using JWT or similar
   - Implement middleware to validate requests

3. **CORS Configuration**
   - Configure CORS to only allow requests from your frontend domain
   ```javascript
   app.use(cors({ 
     origin: ['https://your-frontend-domain.com'], 
     credentials: true 
   }));
   ```

4. **Rate Limiting**
   - Add rate limiting to prevent abuse
   ```javascript
   const rateLimit = require('express-rate-limit');
   app.use(rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   }));
   ```

## Troubleshooting

- **Connection Issues**: Make sure your MongoDB Atlas cluster has network access configured to allow connections from your deployment platform
- **CORS Errors**: Check your CORS configuration and ensure it's allowing requests from your frontend
- **Deployment Failures**: Check the logs on your deployment platform for details

## Monitoring and Maintenance

1. **Logging**: Implement proper logging to track issues
2. **Monitoring**: Use the platform's monitoring tools to track performance
3. **Updates**: Regularly update dependencies to get security fixes
