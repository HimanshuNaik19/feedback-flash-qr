
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Replace with your actual MongoDB connection string
// You'll set this in your .env file
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/feedbackApp";
const dbName = "feedbackApp";

// Middleware
app.use(express.json());
app.use(cors({ 
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:5173'], 
  credentials: true 
}));

// MongoDB client
let client;

// Connect to MongoDB
async function connectToMongo() {
  try {
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log("✅ Connected to MongoDB");
    return client.db(dbName);
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
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
    console.error("Health check failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// Generic collection endpoint handler
app.post('/api/mongodb/:collection/:operation', async (req, res) => {
  try {
    const db = await dbPromise;
    const collection = db.collection(req.params.collection);
    const { query, update, options, document } = req.body;
    
    console.log(`Handling ${req.params.operation} on ${req.params.collection}:`, req.body);
    
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
        console.log(`Found ${results.length} documents`);
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
  console.log(`🚀 MongoDB API server running on port ${port}`);
  console.log(`Health check available at: http://localhost:${port}/api/mongodb/ping`);
});

// Handle shutdown
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
  process.exit(0);
});
