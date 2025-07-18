const mongoose = require("mongoose")

const connections = {}
let mainDbConnection = null // Variable to hold the main DB connection

// Function to connect to the main database
const connectMainDB = async () => {
  if (mainDbConnection && mainDbConnection.readyState === 1) {
    console.log("[DB] Main Database already connected.")
    return mainDbConnection
  }
  try {
    console.log("[DB] Attempting to connect to Main Database...")
    mainDbConnection = await mongoose.createConnection(process.env.MAIN_DB_URI)
    console.log("[DB] Successfully connected to Main Database.")
    return mainDbConnection
  } catch (error) {
    console.error("[DB] Error connecting to Main Database:", error)
    throw error
  }
}

// Function to get the main database connection instance
const getMongooseMainConnection = () => {
  return mainDbConnection
}

// This function now accepts the full dbName
const connectTenantDB = async (dbName) => {
  if (connections[dbName] && connections[dbName].readyState === 1) {
    console.log(`[DB] Reusing existing connection for Tenant Database: ${dbName}`)
    return connections[dbName]
  }
  try {
    console.log(`[DB] Attempting to create new connection for Tenant Database: ${dbName}`)
    // Assuming MONGO_HOST is like "mongodb://localhost:27017/"
    const baseUri = process.env.MONGO_HOST || "mongodb://localhost:27017/"
    const conn = await mongoose.createConnection(`${baseUri}${dbName}`)
    connections[dbName] = conn
    console.log(`[DB] Successfully connected to Tenant Database: ${dbName}`)
    return conn
  } catch (error) {
    console.error(`[DB] Error connecting to Tenant Database ${dbName}:`, error)
    throw error
  }
}

module.exports = {
  connectMainDB,
  connectTenantDB,
  getMongooseMainConnection,
}
