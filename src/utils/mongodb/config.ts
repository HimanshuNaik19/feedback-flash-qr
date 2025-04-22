
import { MongoClient, ServerApiVersion } from 'mongodb';

// Replace this with your actual MongoDB Atlas connection string
const uri = "mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority";

// MongoDB Client with connection pooling and server monitoring
let client: MongoClient | null = null;

// Create a new MongoClient instance
export const getClient = async (): Promise<MongoClient> => {
  if (!client) {
    try {
      client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        }
      });
      
      // Connect to the MongoDB cluster
      await client.connect();
      console.log("✅ Connected successfully to MongoDB Atlas");
      
      // Ping to confirm connection
      await client.db("admin").command({ ping: 1 });
      console.log("✅ MongoDB connection validated successfully");
      
      // Setup connection cleanup on app exit
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
    } catch (error) {
      console.error("❌ MongoDB connection error:", error);
      client = null;
      throw error;
    }
  }
  
  return client;
};

// Get database reference
export const getDb = async (dbName: string = 'feedbackApp') => {
  const client = await getClient();
  return client.db(dbName);
};

// Helper function to close MongoDB connection on app exit
const cleanup = async () => {
  if (client) {
    try {
      await client.close();
      console.log("MongoDB connection closed");
    } catch (err) {
      console.error("Error closing MongoDB connection:", err);
    } finally {
      client = null;
      process.exit(0);
    }
  }
};

// Initialize connection when the module loads
if (typeof window !== 'undefined') {
  getClient().catch(console.error);
}
