const mongoose = require("mongoose")

const StoreGatewaySettingsSchema = new mongoose.Schema(
  {
    storeId: { type: String, required: true, unique: true },
    razorpay: {
      key_id: { type: String },
      key_secret: { type: String },
    },
    stripe: {
      publishable_key: { type: String }, // Added publishable_key for client-side use
      secret_key: { type: String },
    },
    phonepe: {
      merchant_id: { type: String },
      secret_key: { type: String },
    },
    // Add other gateway configurations as needed
  },
  { timestamps: true },
)

module.exports = StoreGatewaySettingsSchema
