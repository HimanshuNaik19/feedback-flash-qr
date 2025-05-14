
// MongoDB API configuration
// This file configures the interaction with our MongoDB backend API

// Define API endpoint (this would point to your actual backend in production)
const API_BASE_URL = '/api/mongodb'; // This would be replaced with your actual backend URL in production

// Helper function for making API requests with error handling
async function apiRequest(endpoint: string, method: string = 'GET', data?: any) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Includes cookies for authentication if needed
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    // Check if the request was successful
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error (${response.status}): ${errorData.message || response.statusText}`);
    }

    // Check if the response is empty
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Generate mock ObjectId for client-side - we'll use actual ObjectIds on the server
export class ObjectId {
  id: string;
  
  constructor(id?: string) {
    this.id = id || crypto.randomUUID();
  }
  
  toString() {
    return this.id;
  }
}

// Updated collection interface that matches the MongoDB Collection interface
// but uses the API under the hood, with proper argument support
export interface ApiCollection {
  find: (query?: any) => {
    toArray: () => Promise<any[]>;
    sort: (sortOptions?: any) => {
      limit: (n: number) => {
        toArray: () => Promise<any[]>;
      };
    };
  };
  findOne: (query: any) => Promise<any>;
  insertOne: (doc: any) => Promise<{ insertedId: string }>;
  updateOne: (query: any, update: any, options?: { upsert?: boolean }) => Promise<{ modifiedCount: number }>;
  deleteOne: (query: any) => Promise<{ deletedCount: number }>;
  deleteMany: (query?: any) => Promise<{ deletedCount: number }>;
}

// Create a mock MongoDB client that uses the API
class ApiMongoClient {
  private connected = false;

  async connect() {
    // Test connection by pinging the API
    try {
      await apiRequest('/ping');
      this.connected = true;
      console.log("✅ Connected successfully to MongoDB API");
    } catch (error) {
      console.error("Failed to connect to MongoDB API:", error);
      // Still mark as connected to allow offline mode to work
      this.connected = true;
    }
    return this;
  }

  async close() {
    this.connected = false;
    console.log("MongoDB API connection closed");
    return true;
  }

  db(name: string) {
    return {
      collection: (collectionName: string): ApiCollection => {
        return {
          find: (query = {}) => {
            return {
              toArray: async () => {
                return await apiRequest(`/${collectionName}/find`, 'POST', { query });
              },
              sort: (sortOptions = {}) => ({
                limit: (limit: number) => ({
                  toArray: async () => {
                    return await apiRequest(`/${collectionName}/find`, 'POST', { 
                      query,
                      options: { sort: sortOptions, limit }
                    });
                  }
                })
              })
            };
          },
          findOne: async (query: any) => {
            return await apiRequest(`/${collectionName}/findOne`, 'POST', { query });
          },
          insertOne: async (doc: any) => {
            return await apiRequest(`/${collectionName}/insertOne`, 'POST', { document: doc });
          },
          updateOne: async (query: any, update: any, options: { upsert?: boolean } = {}) => {
            return await apiRequest(`/${collectionName}/updateOne`, 'POST', { 
              query, 
              update,
              options
            });
          },
          deleteOne: async (query: any) => {
            return await apiRequest(`/${collectionName}/deleteOne`, 'POST', { query });
          },
          deleteMany: async (query = {}) => {
            return await apiRequest(`/${collectionName}/deleteMany`, 'POST', { query });
          }
        };
      },
      command: async (cmd: any) => {
        return await apiRequest('/command', 'POST', { command: cmd });
      }
    };
  }
}

// Create a new API client instance
const client = new ApiMongoClient();

// Export functions for the rest of the application
export const getClient = async () => {
  await client.connect();
  return client;
};

export const getDb = async (dbName: string = 'feedbackApp') => {
  return (await getClient()).db(dbName);
};

// Helper function to close MongoDB connection on app exit
export const cleanup = async () => {
  await client.close();
};

// Initialize connection when the module loads
if (typeof window !== 'undefined') {
  getClient().catch(console.error);
}
