const mongoose = require("mongoose")

const offerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  discountType: { type: String, enum: ["percentage", "fixed"], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  validFrom: { type: Date, default: Date.now },
  validTo: { type: Date },
  isActive: { type: Boolean, default: true },
  // Optional: apply to specific products or categories
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// Export the schema directly
module.exports = offerSchema
