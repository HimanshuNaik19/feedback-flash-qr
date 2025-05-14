
# MySQL Backend API Deployment Guide

This guide provides instructions for deploying your MySQL backend API to various platforms.

## Prerequisites

1. Node.js and npm installed on your development machine
2. A MySQL database server (local or cloud-hosted)
3. Your MySQL connection details:
   ```
   host: your-mysql-host
   user: your-mysql-username
   password: your-mysql-password
   database: feedbackApp
   ```

## Option 1: Deploy to Vercel (Recommended)

Vercel is a cloud platform for static sites and serverless functions that's easy to set up.

### Steps:

1. **Prepare your backend code**
   - Create a new folder for your backend project
   - Initialize a new Node.js project: `npm init -y`
   - Install dependencies: `npm install express mysql2 cors dotenv`
   - Create an `api` folder for serverless functions

2. **Create your API route handler**
   - Create a file `api/mysql.js` (for serverless function)
   - Copy the Express.js example from BACKEND_SETUP.md and adapt it for serverless

3. **Add a vercel.json configuration**
   ```json
   {
     "version": 2,
     "builds": [
       { "src": "api/*.js", "use": "@vercel/node" }
     ],
     "routes": [
       { "src": "/api/(.*)", "dest": "/api/mysql.js" }
     ]
   }
   ```

4. **Set up environment variables**
   - Create a `.env.local` file for local development
   - Add your MySQL connection details:
     ```
     DB_HOST=your-mysql-host
     DB_USER=your-mysql-user
     DB_PASSWORD=your-mysql-password
     DB_NAME=feedbackApp
     ```

5. **Deploy to Vercel**
   - Install Vercel CLI: `npm i -g vercel`
   - Run: `vercel` and follow the prompts
   - Set the environment variables in the Vercel dashboard

6. **Update your frontend configuration**
   - Change the `API_BASE_URL` in `src/utils/mysql/config.ts` to your Vercel deployment URL

## Option 2: Deploy to Heroku

Heroku is a platform as a service (PaaS) that enables developers to build, run, and operate applications entirely in the cloud.

### Steps:

1. **Prepare your backend code**
   - Create a new folder for your backend project
   - Initialize a new Node.js project: `npm init -y`
   - Install dependencies: `npm install express mysql2 cors dotenv`
   - Create a `server.js` file with your Express.js code
   - Create a `Procfile` with: `web: node server.js`

2. **Set up Heroku**
   - Create a Heroku account if you don't have one
   - Install the Heroku CLI: `npm install -g heroku`
   - Login to Heroku: `heroku login`

3. **Create and deploy your app**
   - Create a new Heroku app: `heroku create your-app-name`
   - Add MySQL config: 
     ```
     heroku config:set DB_HOST=your-mysql-host
     heroku config:set DB_USER=your-mysql-user
     heroku config:set DB_PASSWORD=your-mysql-password
     heroku config:set DB_NAME=feedbackApp
     ```
   - Deploy: `git push heroku main`

4. **Update your frontend configuration**
   - Change the `API_BASE_URL` in `src/utils/mysql/config.ts` to your Heroku app URL

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
   - Add environment variables for your MySQL connection details

3. **Update your frontend configuration**
   - Change the `API_BASE_URL` in `src/utils/mysql/config.ts` to your Render deployment URL

## Security Best Practices

1. **Environment Variables**
   - Never commit your MySQL connection details to your repository
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

- **Connection Issues**: Make sure your MySQL server allows remote connections if needed
- **CORS Errors**: Check your CORS configuration and ensure it's allowing requests from your frontend
- **Deployment Failures**: Check the logs on your deployment platform for details

## Monitoring and Maintenance

1. **Logging**: Implement proper logging to track issues
2. **Monitoring**: Use the platform's monitoring tools to track performance
3. **Updates**: Regularly update dependencies to get security fixes
