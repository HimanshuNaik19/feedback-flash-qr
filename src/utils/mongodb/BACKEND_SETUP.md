# MongoDB Backend API Setup Guide

This document provides instructions for setting up a secure backend API for MongoDB that works with this application.

## Why a backend API is necessary

MongoDB cannot be accessed directly from a browser-based application for several reasons:
1. Security - Exposing your database credentials to the client would allow anyone to access your database
2. Technical - MongoDB drivers are designed for Node.js, not browsers
3. Performance - Database operations should happen server-side, not client-side

## Backend API Requirements

Your backend API needs to implement the following endpoints to work with this application:

### Base URL

The base URL is configured in `src/utils/mongodb/config.ts` as `API_BASE_URL`. Change this to match your backend API URL.

### Required Endpoints

All endpoints accept and return JSON data.

#### Connection Test
- `GET /api/mongodb/ping` - Returns `{ "status": "ok" }` if the connection is successful

#### Collection Operations

For each collection (e.g., `feedback`, `qrCodes`), implement:

1. **Find Documents**
   - `POST /api/mongodb/{collection}/find`
   - Body: `{ "query": {}, "options": { "sort": true, "limit": 100 } }`
   - Returns: Array of documents

2. **Find One Document**
   - `POST /api/mongodb/{collection}/findOne`
   - Body: `{ "query": { "id": "document-id" } }`
   - Returns: Single document or null

3. **Insert Document**
   - `POST /api/mongodb/{collection}/insertOne`
   - Body: `{ "document": { ... } }`
   - Returns: `{ "insertedId": "new-document-id" }`

4. **Update Document**
   - `POST /api/mongodb/{collection}/updateOne`
   - Body: `{ "query": { "id": "document-id" }, "update": { "$set": { ... } }, "options": { "upsert": true } }`
   - Returns: `{ "modifiedCount": 1 }`

5. **Delete Document**
   - `POST /api/mongodb/{collection}/deleteOne`
   - Body: `{ "query": { "id": "document-id" } }`
   - Returns: `{ "deletedCount": 1 }`

6. **Delete Multiple Documents**
   - `POST /api/mongodb/{collection}/deleteMany`
   - Body: `{ "query": { "qrCodeId": "qr-id" } }` (or empty `{}` to delete all)
   - Returns: `{ "deletedCount": 5 }`

## Example Backend Implementation

Here's a simple Express.js backend implementation:

```javascript
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Replace with your actual MongoDB connection string
const mongoUri = "mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority";
const dbName = "feedbackApp";

// Middleware
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// MongoDB client
let client;

// Connect to MongoDB
async function connectToMongo() {
  try {
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db(dbName);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

// Initialize connection
let dbPromise = connectToMongo();

// Health check endpoint
app.get('/api/mongodb/ping', async (req, res) => {
  try {
    const db = await dbPromise;
    await db.command({ ping: 1 });
    res.json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generic collection endpoint handler
app.post('/api/mongodb/:collection/:operation', async (req, res) => {
  try {
    const db = await dbPromise;
    const collection = db.collection(req.params.collection);
    const { query, update, options, document } = req.body;
    
    switch (req.params.operation) {
      case 'find':
        let cursor = collection.find(query || {});
        
        if (options?.sort) {
          cursor = cursor.sort({ timestamp: -1 });
        }
        
        if (options?.limit) {
          cursor = cursor.limit(options.limit);
        }
        
        const results = await cursor.toArray();
        res.json(results);
        break;
        
      case 'findOne':
        const doc = await collection.findOne(query || {});
        res.json(doc);
        break;
        
      case 'insertOne':
        const insertResult = await collection.insertOne(document);
        res.json({ insertedId: insertResult.insertedId.toString() });
        break;
        
      case 'updateOne':
        const updateResult = await collection.updateOne(query, update, options || {});
        res.json({ modifiedCount: updateResult.modifiedCount });
        break;
        
      case 'deleteOne':
        const deleteResult = await collection.deleteOne(query);
        res.json({ deletedCount: deleteResult.deletedCount });
        break;
        
      case 'deleteMany':
        const deleteManyResult = await collection.deleteMany(query);
        res.json({ deletedCount: deleteManyResult.deletedCount });
        break;
        
      default:
        res.status(400).json({ error: `Unknown operation: ${req.params.operation}` });
    }
  } catch (error) {
    console.error(`Error in ${req.params.collection}/${req.params.operation}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`MongoDB API server running on port ${port}`);
});

// Handle shutdown
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
  process.exit(0);
});
```

## Deployment

You can deploy this backend API to platforms like:

1. **Vercel** - Deploy the Express API as a serverless function
2. **Heroku** - Deploy as a Node.js application
3. **Render** - Easy deployment for Node.js applications
4. **AWS Lambda** - Serverless deployment option

## Security Considerations

1. **Environment Variables** - Store your MongoDB connection string in environment variables, never in code
2. **Authentication** - Add proper authentication to your API to prevent unauthorized access
3. **Rate Limiting** - Implement rate limiting to prevent abuse
4. **Input Validation** - Validate all input data before passing it to MongoDB
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

1. Create the backend API using the example provided or your preferred framework
2. Deploy the backend API to a hosting platform
3. Update the `API_BASE_URL` in `src/utils/mongodb/config.ts` to point to your deployed API
4. Test the application to ensure it's connecting to your MongoDB database correctly
