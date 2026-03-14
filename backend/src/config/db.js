import mongoose from 'mongoose';

let hasRegisteredEvents = false;
let reconnectTimer = null;
let mongoMemoryServer = null;

const isProduction = process.env.NODE_ENV === 'production';

async function ensureInMemoryMongoServer() {
  if (isProduction) {
    throw new Error('In-memory MongoDB is disabled in production');
  }
  if (!mongoMemoryServer) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create();
  }
  return mongoMemoryServer;
}

// ============================================================
// IMPORTANT: MONGODB_URI must include database name!
// WRONG:   mongodb+srv://user:pass@cluster.net/?retry...
// CORRECT: mongodb+srv://user:pass@cluster.net/sproutsense?retry...
// Set this on Render Dashboard -> Environment -> MONGODB_URI
// ============================================================
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  if (!mongoUri) {
    if (isProduction) {
      console.error('❌ MONGODB_URI is required in production.');
      console.log('⚠️  Set MONGODB_URI on Render Dashboard -> Environment');
      console.log('💡 Format: mongodb+srv://user:pass@cluster.net/sproutsense?retryWrites=true&w=majority');
      return;
    }
    try {
      console.log('🔄 No MONGODB_URI — starting in-memory MongoDB (dev only)...');
      mongoMemoryServer = await ensureInMemoryMongoServer();
      const uri = mongoMemoryServer.getUri();
      await mongoose.connect(uri);
      console.log('✅ In-memory MongoDB connected (dev mode)');
      setupConnectionHandlers();
      return;
    } catch (error) {
      console.error('❌ In-memory MongoDB error:', error.message);
      return;
    }
  }

  // Validate that URI includes database name (not defaulting to 'test')
  const uriHasDbName = /\.net\/[a-zA-Z0-9_-]+\?/.test(mongoUri) ||
                       /\.net\/[a-zA-Z0-9_-]+$/.test(mongoUri);
  if (!uriHasDbName) {
    console.warn('⚠️  WARNING: MONGODB_URI may not include database name!');
    console.warn('⚠️  Data will go to \'test\' database by default.');
    console.warn('💡 Fix: Add /sproutsense before ? in your MONGODB_URI on Render.');
    console.warn('   Example: ...mongodb.net/sproutsense?retryWrites=true&w=majority');
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    const dbName = conn.connection.db.databaseName;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✅ Database name: ${dbName}`);
    if (dbName === 'test') {
      console.warn('⚠️  WARNING: Connected to \'test\' database!');
      console.warn('💡 Fix: Update MONGODB_URI on Render to include /sproutsense');
    } else {
      console.log(`✅ Correct database: ${dbName}`);
    }
    setupConnectionHandlers();
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    if (isProduction) {
      console.log('⚠️  Production: in-memory fallback disabled.');
      return;
    }
    console.log('⚠️  Falling back to in-memory MongoDB...');
    try {
      mongoMemoryServer = await ensureInMemoryMongoServer();
      const uri = mongoMemoryServer.getUri();
      await mongoose.connect(uri);
      console.log('✅ Switched to in-memory MongoDB (dev fallback)');
      setupConnectionHandlers();
    } catch (fallbackError) {
      console.error('❌ In-memory fallback failed:', fallbackError.message);
    }
  }
};

function setupConnectionHandlers() {
  if (!hasRegisteredEvents) {
    hasRegisteredEvents = true;
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Retrying in 10s...');
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connectDB();
        }, 10000);
      }
    });
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      if (mongoMemoryServer) await mongoMemoryServer.stop();
      process.exit(0);
    });
  }
}

export default connectDB;
