const mongoose = require("mongoose")

const PaymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true }, // Unique ID from the payment gateway
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true }, // Reference to the Order
    storeId: { type: String, required: true }, // Store ID for which the payment was made
    tenantId: { type: String, required: true }, // Tenant ID (from req.tenantId)
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true }, // New: Reference to the Customer who made the payment
    customerEmail: { type: String, required: true }, // New: Email of the customer who made the payment
    method: { type: String, required: true }, // e.g., 'razorpay', 'stripe', 'phonepe'
    amount: { type: Number, required: true },
    transactionRef: { type: String }, // Reference from the gateway (e.g., Razorpay payment_id)
    status: { type: String, default: "pending" }, // e.g., 'pending', 'paid', 'failed', 'refunded'
    paidAt: { type: Date },
  },
  { timestamps: true },
)

module.exports = PaymentSchema
