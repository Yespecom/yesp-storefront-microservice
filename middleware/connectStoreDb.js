const mongoose = require("mongoose")
const { connectMainDB, connectTenantDB, getMongooseMainConnection } = require("../config/db")
const StoreConfigSchema = require("../models/main/StoreConfig")

const connections = {} // Cache for tenant database connections

const connectStoreDb = async (req, res, next) => {
  try {
    const storeId = req.params.storeId?.trim() // Ensure storeId is trimmed

    console.log(`[Connect Store DB] Processing request for storeId: ${storeId}`)

    if (!storeId) {
      console.error("[Connect Store DB] Missing storeId in request params")
      return res.status(400).json({ message: "Missing storeId in request params." })
    }

    // 1. Ensure main DB is connected and get its instance
    await connectMainDB()
    const mainDb = getMongooseMainConnection()

    if (!mainDb) {
      console.error("[Connect Store DB] Main database connection not established.")
      return res.status(500).json({ message: "Internal Server Error: Main database not connected." })
    }

    console.log(`[Connect Store DB] Main DB connected to database: '${mainDb.name}'`)
    console.log(`[Connect Store DB] Main DB readyState: ${mainDb.readyState}`)

    // 2. Look up storeId in the main DB to get tenantId
    const StoreConfig = mainDb.models.StoreConfig || mainDb.model("StoreConfig", StoreConfigSchema, "stores") // Explicitly use "stores" collection

    const query = { storeId: storeId }
    console.log(`[Connect Store DB] Querying 'stores' collection with: ${JSON.stringify(query)}`)

    const storeConfig = await StoreConfig.findOne(query)

    console.log(
      "[Connect Store DB] Store config found:",
      storeConfig
        ? {
            storeId: storeConfig.storeId,
            tenantId: storeConfig.tenantId,
            storeName: storeConfig.storeName,
          }
        : "null",
    )

    if (!storeConfig) {
      console.error(`[Connect Store DB] Store config not found in main DB for storeId: '${storeId}'`)

      // List all available stores for debugging
      const allStores = await StoreConfig.find({}, "storeId storeName").limit(10)
      console.log("[Connect Store DB] Available stores in database:")
      allStores.forEach((store) => {
        console.log(`  - StoreId: ${store.storeId}, StoreName: ${store.storeName}`)
      })

      return res.status(404).json({
        message: "Store not found or invalid storeId.",
        providedStoreId: storeId,
        availableStores: allStores.map((s) => s.storeId),
        hint: "Make sure you're using the correct storeId from the database",
      })
    }

    const tenantId = storeConfig.tenantId
    // IMPORTANT CHANGE: Convert tenantId to lowercase for database name consistency
    const tenantDbName = `tenant_${tenantId.toLowerCase()}` // Construct tenant database name

    console.log(`[Connect Store DB] Connecting to tenant database: ${tenantDbName}`)

    // 3. Connect to the specific tenant database
    const tenantDb = await connectTenantDB(tenantDbName)

    if (!tenantDb) {
      console.error(`[Connect Store DB] Failed to connect to tenant DB: ${tenantDbName}`)
      return res.status(500).json({ message: "Failed to connect to store's tenant database." })
    }

    console.log(`[Connect Store DB] Tenant DB readyState: ${tenantDb.readyState}`)

    req.storeDb = tenantDb // Attach the tenant-specific connection to the request
    req.tenantId = tenantId // Also attach tenantId for controllers that might need it

    console.log(
      `[Connect Store DB] Successfully connected to Tenant Database: '${tenantDbName}' for storeId: '${storeId}'`,
    )
    next()
  } catch (error) {
    console.error("[Connect Store DB Error]", error)
    res.status(500).json({
      message: "Failed to connect to store DB.",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
}

module.exports = connectStoreDb
