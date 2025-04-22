
// Mock MongoDB implementation for browser environment
// In a real app, you would use a backend API to communicate with MongoDB

// Simulated MongoDB client for browser environment
class MockMongoClient {
  private connected = false;
  private collections: Record<string, any[]> = {};

  async connect() {
    this.connected = true;
    console.log("✅ Connected successfully to Mock MongoDB");
    return this;
  }

  async close() {
    this.connected = false;
    console.log("MongoDB connection closed");
    return true;
  }

  db(name: string) {
    return {
      collection: (collectionName: string) => {
        if (!this.collections[collectionName]) {
          this.collections[collectionName] = [];
        }
        return {
          find: (query = {}) => {
            // Simple mock implementation
            return {
              toArray: async () => {
                return [...this.collections[collectionName]];
              },
              sort: () => ({
                limit: () => ({
                  toArray: async () => [...this.collections[collectionName]]
                })
              })
            };
          },
          findOne: async (query: any) => {
            if (query.id) {
              return this.collections[collectionName].find(item => item.id === query.id);
            }
            return null;
          },
          insertOne: async (doc: any) => {
            const id = Math.random().toString(36).substring(2, 15);
            const newDoc = { ...doc, _id: id };
            this.collections[collectionName].push(newDoc);
            return { insertedId: id };
          },
          updateOne: async (query: any, update: any, options = {}) => {
            if (query.id) {
              const index = this.collections[collectionName].findIndex(item => item.id === query.id);
              if (index !== -1) {
                this.collections[collectionName][index] = {
                  ...this.collections[collectionName][index],
                  ...update.$set
                };
              } else if (options.upsert) {
                const newDoc = { ...update.$set, _id: Math.random().toString(36).substring(2, 15), id: query.id };
                this.collections[collectionName].push(newDoc);
              }
            }
            return { modifiedCount: 1 };
          },
          deleteOne: async (query: any) => {
            let deletedCount = 0;
            if (query.id) {
              const index = this.collections[collectionName].findIndex(item => item.id === query.id);
              if (index !== -1) {
                this.collections[collectionName].splice(index, 1);
                deletedCount = 1;
              }
            }
            return { deletedCount };
          },
          deleteMany: async (query: any) => {
            if (Object.keys(query).length === 0) {
              // Delete all documents
              const count = this.collections[collectionName].length;
              this.collections[collectionName] = [];
              return { deletedCount: count };
            } else if (query.qrCodeId) {
              const initialLength = this.collections[collectionName].length;
              this.collections[collectionName] = this.collections[collectionName].filter(
                item => item.qrCodeId !== query.qrCodeId
              );
              return { deletedCount: initialLength - this.collections[collectionName].length };
            }
            return { deletedCount: 0 };
          },
          command: async (cmd: any) => {
            if (cmd.ping) return { ok: 1 };
            return { ok: 0 };
          }
        };
      },
      command: async (cmd: any) => {
        if (cmd.ping) return { ok: 1 };
        return { ok: 0 };
      }
    };
  }
}

// Create a new MongoClient instance
const client = new MockMongoClient();

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
