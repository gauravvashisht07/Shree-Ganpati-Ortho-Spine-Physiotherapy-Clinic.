const path = require('path');
const dns = require('dns');

// On Windows or certain networks, SRV DNS lookups fail on default DNS. Configure public DNS resolver:
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if not permitted
}

const rootEnvPath = path.resolve(__dirname, '../.env');
const serverEnvPath = path.resolve(__dirname, '.env');
require('dotenv').config({ path: rootEnvPath });
require('dotenv').config({ path: serverEnvPath, override: true });

const mongoose = require('mongoose');
const app = require('./app');
const seedAdmin = require('./utils/seedAdmin');

const PORT = process.env.PORT || 5000;
let MONGO_URI = process.env.MONGO_URI;

// Automatically format and encode credentials if raw '@' is found in password
if (MONGO_URI && MONGO_URI.startsWith('mongodb')) {
  try {
    const match = MONGO_URI.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.+)@([^/?]+)(\/.*)?$/);
    if (match) {
      const [, proto, user, rawPass, host, rest] = match;
      if (rawPass.includes('@') && !rawPass.includes('%40')) {
        const encodedPass = encodeURIComponent(decodeURIComponent(rawPass));
        MONGO_URI = `${proto}${user}:${encodedPass}@${host}${rest || ''}`;
      }
    }
  } catch (err) {
    // Ignore and fallback to original MONGO_URI
  }
}

const startServer = async () => {
  try {
    if (MONGO_URI) {
      await mongoose.connect(MONGO_URI);
      console.log('Connected to MongoDB');
      await seedAdmin();
    } else {
      console.warn('Warning: MONGO_URI is not defined. Server running without DB connection.');
    }
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
