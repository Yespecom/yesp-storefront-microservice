const storeGatewaySettingsSchema = require("../models/tenant/StoreGatewaySettings")
const paymentSchema = require("../models/tenant/Payment")
const orderSchema = require("../models/tenant/Order")
const customerSchema = require("../models/tenant/Customer")

exports.getPaymentGateways = async (req, res) => {
  const { storeDb, storeId } = req
  try {
    const StoreGatewaySettings = storeDb.model("StoreGatewaySettings", storeGatewaySettingsSchema)

    const settings = await StoreGatewaySettings.findOne({ storeId: storeId })

    if (!settings) {
      return res.status(404).json({ message: "Payment gateway settings not found for this store." })
    }

    const availableGateways = []
    if (settings.razorpay && settings.razorpay.key_id) {
      availableGateways.push({
        name: "Razorpay",
        type: "razorpay",
        config: { key_id: settings.razorpay.key_id },
      })
    }
    if (settings.stripe && settings.stripe.publishable_key) {
      availableGateways.push({
        name: "Stripe",
        type: "stripe",
        config: { publishable_key: settings.stripe.publishable_key },
      })
    }
    if (settings.phonepe && settings.phonepe.merchant_id) {
      availableGateways.push({
        name: "PhonePe",
        type: "phonepe",
        config: { merchant_id: settings.phonepe.merchant_id },
      })
    }

    res.status(200).json(availableGateways)
  } catch (error) {
    console.error("Error listing payment gateways:", error)
    res.status(500).json({ message: "Server error listing payment gateways." })
  }
}

exports.createPaymentIntent = async (req, res) => {
  const { storeDb, userId, storeId, tenantId } = req
  const { orderId, method } = req.body

  if (!orderId || !method) {
    return res.status(400).json({ message: "Order ID and payment method are required to create a payment intent." })
  }

  try {
    const Order = storeDb.model("Order", orderSchema)
    const Payment = storeDb.model("Payment", paymentSchema)
    const StoreGatewaySettings = storeDb.model("StoreGatewaySettings", storeGatewaySettingsSchema)
    const Customer = storeDb.model("Customer", customerSchema)

    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ message: "Order not found." })
    }

    if (order.customerId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized to create payment intent for this order." })
    }

    if (order.paymentStatus !== "pending") {
      return res.status(400).json({ message: "Order is not in a pending payment status." })
    }

    const customer = await Customer.findById(userId)
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." })
    }

    const settings = await StoreGatewaySettings.findOne({ storeId: storeId })
    if (!settings) {
      return res.status(404).json({ message: "Payment gateway settings not found for this store." })
    }

    let clientSecret = null
    let paymentGatewayRef = null

    switch (method) {
      case "stripe":
        if (!settings.stripe || !settings.stripe.secret_key) {
          return res.status(400).json({ message: "Stripe not configured for this store." })
        }
        clientSecret = `pi_mock_stripe_${Date.now()}_secret`
        paymentGatewayRef = `pi_mock_stripe_${Date.now()}`
        break
      case "razorpay":
        if (!settings.razorpay || !settings.razorpay.key_secret) {
          return res.status(400).json({ message: "Razorpay not configured for this store." })
        }
        clientSecret = `order_mock_razorpay_${Date.now()}`
        paymentGatewayRef = `order_mock_razorpay_${Date.now()}`
        break
      case "phonepe":
        if (!settings.phonepe || !settings.phonepe.secret_key) {
          return res.status(400).json({ message: "PhonePe not configured for this store." })
        }
        clientSecret = `mock_phonepe_redirect_url_${Date.now()}`
        paymentGatewayRef = `mock_phonepe_transaction_${Date.now()}`
        break
      default:
        return res.status(400).json({ message: "Unsupported payment method." })
    }

    const newPayment = new Payment({
      paymentId: paymentGatewayRef,
      orderId: order._id,
      storeId: storeId,
      tenantId: tenantId,
      customerId: customer._id,
      customerEmail: customer.email,
      method: method,
      amount: order.totalAmount,
      transactionRef: paymentGatewayRef,
      status: "pending",
    })
    await newPayment.save()

    order.paymentDetails = {
      ...order.paymentDetails,
      paymentIntentId: paymentGatewayRef,
      method: method,
    }
    await order.save()

    res.status(200).json({
      message: "Payment intent created successfully",
      clientSecret: clientSecret,
      paymentId: newPayment._id,
      orderId: order._id,
      amount: order.totalAmount,
      method: method,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    res.status(500).json({ message: "Server error creating payment intent." })
  }
}

exports.handlePaymentWebhook = async (req, res) => {
  const { storeDb, storeId } = req
  const { gatewayName } = req.params
  const webhookPayload = req.body // The actual payload from the payment gateway

  console.log(`[Webhook] Received ${gatewayName} webhook for storeId: ${storeId}`)
  console.log("[Webhook] Payload:", JSON.stringify(webhookPayload, null, 2))

  try {
    const Payment = storeDb.model("Payment", paymentSchema)
    const Order = storeDb.model("Order", orderSchema)
    const StoreGatewaySettings = storeDb.model("StoreGatewaySettings", storeGatewaySettingsSchema)

    // --- 1. Verify Webhook Signature (Crucial for Production) ---
    // In a real scenario, you would fetch the webhook secret from StoreGatewaySettings
    // and use it to verify the signature provided in the request headers.
    // Example for Stripe: const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    // For this mock, we'll just log a message.
    const settings = await StoreGatewaySettings.findOne({ storeId: storeId })
    if (!settings) {
      console.error(`[Webhook] Store gateway settings not found for storeId: ${storeId}. Cannot verify webhook.`)
      return res.status(400).json({ message: "Store not configured for webhooks." })
    }
    console.log(`[Webhook] Simulating signature verification for ${gatewayName}... (In production, verify with secret)`)
    // Example: const secret = settings[gatewayName]?.webhookSecret || settings[gatewayName]?.secret_key;
    // if (!secret) { console.warn(`[Webhook] No secret found for ${gatewayName} webhook verification.`); }

    // --- 2. Process Webhook Event ---
    // This logic will vary greatly depending on the payment gateway and event type.
    // We'll assume a simple structure for demonstration.
    const { eventType, transactionId, status, orderId: externalOrderId } = webhookPayload

    if (!transactionId || !status) {
      return res.status(400).json({ message: "Missing transactionId or status in webhook payload." })
    }

    // Find the internal Payment record using the transactionRef (which is paymentId from createPaymentIntent)
    const paymentRecord = await Payment.findOne({ paymentId: transactionId })

    if (!paymentRecord) {
      console.warn(`[Webhook] Payment record not found for transactionId: ${transactionId}.`)
      return res.status(404).json({ message: "Payment record not found." })
    }

    // Update Payment record status
    paymentRecord.status = status // e.g., 'paid', 'failed', 'refunded'
    if (status === "paid") {
      paymentRecord.paidAt = new Date()
    }
    await paymentRecord.save()
    console.log(`[Webhook] Payment record ${paymentRecord._id} updated to status: ${status}`)

    // Update associated Order status
    const order = await Order.findById(paymentRecord.orderId)
    if (order) {
      order.paymentStatus = status // Update order's payment status
      if (status === "paid") {
        order.status = "processing" // Move order to processing if paid
      } else if (status === "failed" || status === "refunded") {
        // Handle failed/refunded orders (e.g., revert stock, notify customer)
        order.status = "cancelled" // Or a specific 'payment_failed' status
      }
      await order.save()
      console.log(`[Webhook] Order ${order._id} paymentStatus updated to: ${status}`)
    } else {
      console.warn(
        `[Webhook] Associated order ${paymentRecord.orderId} not found for payment record ${paymentRecord._id}.`,
      )
    }

    res.status(200).json({ received: true, message: "Webhook processed successfully." })
  } catch (error) {
    console.error("[Webhook] Error processing payment webhook:", error)
    res.status(500).json({ message: "Internal server error processing webhook." })
  }
}
