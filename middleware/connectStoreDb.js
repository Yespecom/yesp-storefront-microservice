const mongoose = require("mongoose")
const { connectMainDB, connectTenantDB, getMongooseMainConnection } = require("../config/db")
const StoreConfigSchema = require("../models/main/StoreConfig")

const connections = {} // Cache for tenant database connections

const connectStoreDb = async (req, res, next) => {
  try {
    const storeId = req.params.storeId?.trim() // Ensure storeId is trimmed

    if (!storeId) {
      return res.status(400).json({ message: "Missing storeId in request params." })
    }

    // 1. Ensure main DB is connected and get its instance
    await connectMainDB()
    const mainDb = getMongooseMainConnection()

    if (!mainDb) {
      console.error("[Connect Store DB] Main database connection not established.")
      return res.status(500).json({ message: "Internal Server Error: Main database not connected." })
    }

    // --- New Diagnostic Logs ---
    console.log(`[Connect Store DB] Main DB connected to database: '${mainDb.name}'`)
    const collections = await mainDb.db.listCollections().toArray()
    console.log(`[Connect Store DB] Collections in main DB: ${collections.map((c) => c.name).join(", ")}`)
    // --- End New Diagnostic Logs ---

    // 2. Look up storeId in the main DB to get tenantId
    const StoreConfig = mainDb.models.StoreConfig || mainDb.model("StoreConfig", StoreConfigSchema, "stores") // Explicitly use "stores" collection

    const query = { storeId: storeId }
    console.log(`[Connect Store DB] Querying 'stores' collection with: ${JSON.stringify(query)}`)

    const storeConfig = await StoreConfig.findOne(query)

    console.log("[Connect Store DB] Store config found (from main DB):", storeConfig ? storeConfig.toObject() : "null")

    if (!storeConfig) {
      console.error(`[Connect Store DB] Store config not found in main DB for storeId: '${storeId}'`)
      return res.status(404).json({ message: "Store not found or invalid storeId." })
    }

    const tenantId = storeConfig.tenantId
    // IMPORTANT CHANGE: Convert tenantId to lowercase for database name consistency
    const tenantDbName = `tenant_${tenantId.toLowerCase()}` // Construct tenant database name

    // 3. Connect to the specific tenant database
    const tenantDb = await connectTenantDB(tenantDbName)

    if (!tenantDb) {
      console.error(`[Connect Store DB] Failed to connect to tenant DB: ${tenantDbName}`)
      return res.status(500).json({ message: "Failed to connect to store's tenant database." })
    }

    req.storeDb = tenantDb // Attach the tenant-specific connection to the request
    req.tenantId = tenantId // Also attach tenantId for controllers that might need it

    console.log(
      `[Connect Store DB] Successfully connected to Tenant Database: '${tenantDbName}' for storeId: '${storeId}'`,
    )
    next()
  } catch (error) {
    console.error("[Connect Store DB Error]", error)
    res.status(500).json({ message: "Failed to connect to store DB." })
  }
}

module.exports = connectStoreDb
