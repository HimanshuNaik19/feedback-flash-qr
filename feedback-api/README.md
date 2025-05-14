
# Feedback API

This is a MongoDB backend API for the QR Code Feedback Application.

## Setup Instructions

1. **Install dependencies**

```bash
npm install
```

2. **Set up environment variables**

Copy the example environment file and modify it with your MongoDB connection string:

```bash
cp .env.example .env
```

Edit the `.env` file to include your MongoDB connection string.

3. **Start the server**

For development with auto-reload:
```bash
npm run dev
```

For production:
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /api/mongodb/ping` - Returns `{ "status": "ok" }` if connected

### Collection Operations

For each collection (e.g., `feedback`, `qrCodes`), the API supports:

1. **Find Documents**
   - `POST /api/mongodb/{collection}/find`
   - Body: `{ "query": {}, "options": { "sort": true, "limit": 100 } }`

2. **Find One Document**
   - `POST /api/mongodb/{collection}/findOne`
   - Body: `{ "query": { "id": "document-id" } }`

3. **Insert Document**
   - `POST /api/mongodb/{collection}/insertOne`
   - Body: `{ "document": { ... } }`

4. **Update Document**
   - `POST /api/mongodb/{collection}/updateOne`
   - Body: `{ "query": { "id": "document-id" }, "update": { "$set": { ... } }, "options": { "upsert": true } }`

5. **Delete Document**
   - `POST /api/mongodb/{collection}/deleteOne`
   - Body: `{ "query": { "id": "document-id" } }`

6. **Delete Multiple Documents**
   - `POST /api/mongodb/{collection}/deleteMany`
   - Body: `{ "query": { "qrCodeId": "qr-id" } }`

## Local Development with Frontend

1. Start this backend API server on port 3000
2. Start the frontend application (it will proxy API requests to this server)
