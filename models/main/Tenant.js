const mongoose = require("mongoose")

// This schema now directly represents a store configuration document
const tenantSchema = new mongoose.Schema({
  storeName: { type: String, required: true },
  storeId: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true }, // Assuming this links to a higher-level tenant
  secretApiKey: { type: String, required: true }, // Kept for schema consistency, but not used for validation in new flow
  category: { type: String },
  gstNumber: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId }, // Assuming this is a user ID
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// Explicitly define the collection name as "tenants"
module.exports = mongoose.model("Tenant", tenantSchema, "tenants")
