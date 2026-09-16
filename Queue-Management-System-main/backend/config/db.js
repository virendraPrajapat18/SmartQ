/**
 * ============================================================================
 * DATABASE CONFIGURATION
 * ============================================================================
 * This file handles the connection to the MongoDB database using Mongoose.
 * It is called in server.js during the application startup process.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Attempt to connect to the database using the URI from environment variables
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If the connection fails, log the error and exit the Node.js process
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit code 1 indicates failure
  }
};

module.exports = connectDB;
