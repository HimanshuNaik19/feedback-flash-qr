# MySQL Backend API Setup Guide

This document provides instructions for setting up a secure backend API for MySQL that works with this application.

## Why a backend API is necessary

MySQL cannot be accessed directly from a browser-based application for several reasons:
1. Security - Exposing your database credentials to the client would allow anyone to access your database
2. Technical - MySQL drivers are designed for Node.js, not browsers
3. Performance - Database operations should happen server-side, not client-side

## Backend API Requirements

Your backend API needs to implement the following endpoints to work with this application:

### Base URL

The base URL is configured in `src/utils/mysql/config.ts` as `API_BASE_URL`. Change this to match your backend API URL.

### Required Endpoints

All endpoints accept and return JSON data.

#### Connection Test
- `GET /api/mysql/ping` - Returns `{ "status": "ok" }` if the connection is successful

#### Collection Operations

For each table (e.g., `feedback`, `qrCodes`), implement:

1. **Find Documents**
   - `POST /api/mysql/{table}/find`
   - Body: `{ "query": {}, "options": { "sort": true, "limit": 100 } }`
   - Returns: Array of documents

2. **Find One Document**
   - `POST /api/mysql/{table}/findOne`
   - Body: `{ "query": { "id": "document-id" } }`
   - Returns: Single document or null

3. **Insert Document**
   - `POST /api/mysql/{table}/insertOne`
   - Body: `{ "document": { ... } }`
   - Returns: `{ "insertedId": "new-document-id" }`

4. **Update Document**
   - `POST /api/mysql/{table}/updateOne`
   - Body: `{ "query": { "id": "document-id" }, "update": { "$set": { ... } }, "options": { "upsert": true } }`
   - Returns: `{ "modifiedCount": 1 }`

5. **Delete Document**
   - `POST /api/mysql/{table}/deleteOne`
   - Body: `{ "query": { "id": "document-id" } }`
   - Returns: `{ "deletedCount": 1 }`

6. **Delete Multiple Documents**
   - `POST /api/mysql/{table}/deleteMany`
   - Body: `{ "query": { "qrCodeId": "qr-id" } }` (or empty `{}` to delete all)
   - Returns: `{ "deletedCount": 5 }`

## Example Backend Implementation

Please see the example Express.js implementation in the `feedback-api/server.js` file in this project.

## Deployment

You can deploy this backend API to platforms like:

1. **Vercel** - Deploy the Express API as a serverless function
2. **Heroku** - Deploy as a Node.js application
3. **Render** - Easy deployment for Node.js applications
4. **AWS Lambda** - Serverless deployment option

## Security Considerations

1. **Environment Variables** - Store your MySQL connection details in environment variables, never in code
2. **Authentication** - Add proper authentication to your API to prevent unauthorized access
3. **Rate Limiting** - Implement rate limiting to prevent abuse
4. **Input Validation** - Validate all input data before passing it to MySQL
5. **CORS** - Configure CORS to only allow requests from your frontend domain

## Local Development

For local development:
1. Run your backend API server on a different port (e.g., 3000)
2. Update the `API_BASE_URL` in `config.ts` to point to your local server
3. Use a proxy in your Vite config to forward requests (see below)

```javascript
// vite.config.ts addition
export default defineConfig({
  // ... other config
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

## Next Steps

1. Create the MySQL database and tables using the schema in `feedback-api/server.js`
2. Deploy the backend API to a hosting platform
3. Update the `API_BASE_URL` in `src/utils/mysql/config.ts` to point to your deployed API
4. Test the application to ensure it's connecting to your MySQL database correctly
