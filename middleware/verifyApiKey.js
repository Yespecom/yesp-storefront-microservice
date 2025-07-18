const { connectMainDB, getMongooseMainConnection } = require("../config/db")
const mongoose = require("mongoose")

const storeSchema = new mongoose.Schema(
  {
    storeId: String,
    tenantId: String,
    secretApiKey: String,
  },
  { collection: "stores" },
) // Ensure it connects to 'stores'

module.exports = async function verifyApiKey(req, res, next) {
  try {
    const storeId = req.params.storeId?.trim() // Trim storeId directly from params
    const apiKey = req.headers["x-api-key"]

    console.log(`[Verify API Key] Request received for storeId: '${storeId}' and apiKey: '${apiKey}'`)

    if (!storeId || !apiKey) {
      console.error("[Verify API Key] Missing storeId or x-api-key in request.")
      return res.status(400).json({ message: "Missing storeId or x-api-key" })
    }

    await connectMainDB() // Ensure main DB is connected (idempotent)
    const mainDb = getMongooseMainConnection() // Get the established connection

    if (!mainDb) {
      console.error("[Verify API Key] Main database connection not established (mainDb is null).")
      return res.status(500).json({ message: "Internal Server Error: Database not connected." })
    }

    console.log(`[Verify API Key] Main DB connection readyState: ${mainDb.readyState}`)

    // Define the Store model using the mainDb connection and the explicit schema
    // Use mainDb.models.Store to prevent re-compiling the model if it already exists
    const Store = mainDb.models.Store || mainDb.model("Store", storeSchema)

    console.log(`[Verify API Key] Store model collection name: ${Store.collection.name}`)

    // Check if any documents exist in the 'stores' collection
    const totalStores = await Store.countDocuments({})
    console.log(`[Verify API Key] Total documents in 'stores' collection: ${totalStores}`)

    console.log(`[Verify API Key] Attempting to find store with storeId: '${storeId}'`)
    const store = await Store.findOne({ storeId })

    console.log("[Verify API Key] Store config found:", store ? store.toObject() : "null")

    if (!store) {
      console.error(`[Verify API Key] Store config not found for storeId: '${storeId}'.`)
      return res.status(404).json({ message: "Invalid storeId." })
    }

    if (store.secretApiKey !== apiKey) {
      console.error(
        `[Verify API Key] Invalid x-api-key provided for storeId: '${storeId}'. DB secretApiKey: '${store.secretApiKey}', Provided apiKey: '${apiKey}'`,
      )
      return res.status(403).json({ message: "Invalid x-api-key for store." })
    }

    // Pass tenantId and storeId forward
    req.tenantId = store.tenantId
    req.storeId = store.storeId // Ensure req.storeId is the one from the DB
    console.log(`[Verify API Key] API key and storeId validated successfully for store: '${store.storeName}'`)
    next()
  } catch (err) {
    console.error("API Key verification error:", err.message)
    res.status(500).json({ message: "Internal Server Error" })
  }
}
