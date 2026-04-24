const dns = require('node:dns');
// This forces Node to use Google's DNS to bypass the ECONNREFUSED error
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;

if (!uri) {
    console.error("❌ ERROR: MONGO_URI is not defined in your .env file!");
    process.exit(1);
}

console.log("Attempting to connect to MongoDB Atlas...");

mongoose.connect(uri)
  .then(() => {
    console.log("✅ SUCCESS: Connected to MongoDB Atlas!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ CONNECTION ERROR:", err.message);
    // If you still get ECONNREFUSED here, check your Atlas IP Whitelist (0.0.0.0/0)
    process.exit(1);
  });