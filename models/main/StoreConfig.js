const mongoose = require("mongoose")

// This schema represents a store configuration document in the main database
const storeConfigSchema = new mongoose.Schema({
  storeName: { type: String, required: true },
  storeId: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, unique: true }, // Unique tenant ID associated with this store
  secretApiKey: { type: String }, // Kept for schema consistency, but not used for validation in this flow
  category: { type: String },
  gstNumber: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId }, // Assuming this is a user ID
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// Export the schema directly, not the compiled model
module.exports = storeConfigSchema
