
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'feedbackApp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Middleware
app.use(express.json());
app.use(cors({ 
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:5173'], 
  credentials: true 
}));

// MySQL connection pool
let pool;

// Connect to MySQL
async function connectToMySQL() {
  try {
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    console.log("✅ Connected to MySQL");
    connection.release();
    return pool;
  } catch (error) {
    console.error("❌ Error connecting to MySQL:", error);
    throw error;
  }
}

// Initialize connection
let dbPromise = connectToMySQL();

// Health check endpoint
app.get('/api/mysql/ping', async (req, res) => {
  try {
    await dbPromise;
    const [result] = await pool.query('SELECT 1 as ping');
    res.json({ status: "ok", result: result[0] });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize database schema
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create feedback table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id VARCHAR(36) PRIMARY KEY,
        qrCodeId VARCHAR(36) NOT NULL,
        name VARCHAR(255),
        phoneNumber VARCHAR(20),
        email VARCHAR(255),
        sentiment VARCHAR(20),
        createdAt VARCHAR(50),
        message TEXT,
        rating INT,
        comment TEXT,
        context TEXT,
        customAnswers JSON,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (qrCodeId)
      )
    `);
    
    // Create qrCodes table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS qrCodes (
        id VARCHAR(36) PRIMARY KEY,
        context TEXT,
        createdAt VARCHAR(50),
        expiresAt VARCHAR(50),
        maxScans INT DEFAULT 100,
        currentScans INT DEFAULT 0,
        isActive BOOLEAN DEFAULT TRUE,
        customQuestions JSON
      )
    `);
    
    connection.release();
    console.log("✅ Database schema initialized");
  } catch (error) {
    console.error("❌ Error initializing database schema:", error);
    throw error;
  }
}

// Generic API endpoint functions
async function findDocuments(table, query, options = {}) {
  try {
    let sql = `SELECT * FROM ${table}`;
    const values = [];
    
    // Build WHERE clause from query
    if (query && Object.keys(query).length > 0) {
      const conditions = [];
      for (const [key, value] of Object.entries(query)) {
        conditions.push(`${key} = ?`);
        values.push(value);
      }
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }
    }
    
    // Add sorting
    if (options.sort) {
      sql += ' ORDER BY timestamp DESC';
    }
    
    // Add limit
    if (options.limit) {
      sql += ' LIMIT ?';
      values.push(options.limit);
    }
    
    const [rows] = await pool.query(sql, values);
    
    // Parse JSON fields
    return rows.map(row => {
      if (row.customAnswers && typeof row.customAnswers === 'string') {
        row.customAnswers = JSON.parse(row.customAnswers);
      }
      if (row.customQuestions && typeof row.customQuestions === 'string') {
        row.customQuestions = JSON.parse(row.customQuestions);
      }
      return row;
    });
  } catch (error) {
    console.error(`Error finding documents in ${table}:`, error);
    throw error;
  }
}

async function findOneDocument(table, query) {
  try {
    const results = await findDocuments(table, query, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error(`Error finding document in ${table}:`, error);
    throw error;
  }
}

async function insertDocument(table, document) {
  try {
    // Convert JSON fields to strings
    const doc = { ...document };
    if (doc.customAnswers && typeof doc.customAnswers !== 'string') {
      doc.customAnswers = JSON.stringify(doc.customAnswers);
    }
    if (doc.customQuestions && typeof doc.customQuestions !== 'string') {
      doc.customQuestions = JSON.stringify(doc.customQuestions);
    }
    
    const keys = Object.keys(doc);
    const values = Object.values(doc);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const [result] = await pool.query(sql, values);
    
    return { insertedId: doc.id };
  } catch (error) {
    console.error(`Error inserting document into ${table}:`, error);
    throw error;
  }
}

async function updateDocument(table, query, update) {
  try {
    // Handle $set operator
    let setValues = update;
    if (update.$set) {
      setValues = update.$set;
    }
    
    // Convert JSON fields to strings
    if (setValues.customAnswers && typeof setValues.customAnswers !== 'string') {
      setValues.customAnswers = JSON.stringify(setValues.customAnswers);
    }
    if (setValues.customQuestions && typeof setValues.customQuestions !== 'string') {
      setValues.customQuestions = JSON.stringify(setValues.customQuestions);
    }
    
    const setEntries = Object.entries(setValues);
    const set = setEntries.map(([key]) => `${key} = ?`).join(', ');
    const values = [...setEntries.map(([_, value]) => value)];
    
    // Build WHERE clause
    const conditions = [];
    for (const [key, value] of Object.entries(query)) {
      conditions.push(`${key} = ?`);
      values.push(value);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `UPDATE ${table} SET ${set} ${whereClause}`;
    
    const [result] = await pool.query(sql, values);
    return { modifiedCount: result.affectedRows };
  } catch (error) {
    console.error(`Error updating document in ${table}:`, error);
    throw error;
  }
}

async function deleteDocuments(table, query) {
  try {
    // Build WHERE clause
    const conditions = [];
    const values = [];
    for (const [key, value] of Object.entries(query)) {
      conditions.push(`${key} = ?`);
      values.push(value);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `DELETE FROM ${table} ${whereClause}`;
    
    const [result] = await pool.query(sql, values);
    return { deletedCount: result.affectedRows };
  } catch (error) {
    console.error(`Error deleting documents from ${table}:`, error);
    throw error;
  }
}

// Generic collection endpoint handler
app.post('/api/mysql/:collection/:operation', async (req, res) => {
  try {
    const collection = req.params.collection;
    const { query, update, options, document } = req.body;
    
    console.log(`Handling ${req.params.operation} on ${collection}:`, req.body);
    
    switch (req.params.operation) {
      case 'find':
        const results = await findDocuments(collection, query, options || {});
        console.log(`Found ${results.length} documents`);
        res.json(results);
        break;
        
      case 'findOne':
        const doc = await findOneDocument(collection, query || {});
        res.json(doc);
        break;
        
      case 'insertOne':
        const insertResult = await insertDocument(collection, document);
        res.json({ insertedId: insertResult.insertedId.toString() });
        break;
        
      case 'updateOne':
        const updateResult = await updateDocument(collection, query, update);
        res.json({ modifiedCount: updateResult.modifiedCount });
        break;
        
      case 'deleteOne':
        const deleteResult = await deleteDocuments(collection, query);
        res.json({ deletedCount: deleteResult.deletedCount });
        break;
        
      case 'deleteMany':
        const deleteManyResult = await deleteDocuments(collection, query);
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
app.listen(port, async () => {
  console.log(`🚀 MySQL API server running on port ${port}`);
  console.log(`Health check available at: http://localhost:${port}/api/mysql/ping`);
  
  // Initialize database schema
  try {
    await dbPromise;
    await initializeDatabase();
  } catch (error) {
    console.error("Failed to initialize database schema:", error);
  }
});

// Handle shutdown
process.on('SIGINT', async () => {
  if (pool) {
    await pool.end();
    console.log('MySQL connection pool closed');
  }
  process.exit(0);
});
