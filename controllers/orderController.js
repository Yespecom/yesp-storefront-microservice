const orderSchema = require("../models/tenant/Order") // Import schemas directly
const productSchema = require("../models/tenant/Product")
const customerSchema = require("../models/tenant/Customer")

exports.getOrders = async (req, res) => {
  const { storeDb, userId } = req // Get storeDb from middleware, userId from customerAuth
  try {
    const Order = storeDb.model("Order", orderSchema)
    const orders = await Order.find({ customerId: userId }).populate("items.productId", "name images")
    res.status(200).json(orders)
  } catch (error) {
    console.error("Error getting customer orders:", error)
    res.status(500).json({ message: "Server error getting orders." })
  }
}

exports.placeOrder = async (req, res) => {
  const { storeDb, userId } = req // Get storeDb from middleware, userId from customerAuth
  const { items, shippingAddress } = req.body

  if (!items || items.length === 0 || !shippingAddress) {
    return res.status(400).json({ message: "Order items and shipping address are required." })
  }

  try {
    const Order = storeDb.model("Order", orderSchema)
    const Product = storeDb.model("Product", productSchema)
    const Customer = storeDb.model("Customer", customerSchema)

    // Verify customer exists
    const customer = await Customer.findById(userId)
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." })
    }

    let totalAmount = 0
    const orderItems = []

    for (const item of items) {
      const product = await Product.findById(item.productId)
      if (!product || !product.isActive || product.stock < item.quantity) {
        return res.status(400).json({ message: `Product ${item.productId} is unavailable or out of stock.` })
      }

      orderItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
      })
      totalAmount += product.price * item.quantity
    }

    const newOrder = new Order({
      customerId: userId,
      items: orderItems,
      totalAmount,
      shippingAddress,
      status: "pending", // Initial status
      paymentStatus: "pending", // Initial payment status
    })

    await newOrder.save()

    // Optionally, reduce product stock here
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
    }

    res.status(201).json({ message: "Order placed successfully", order: newOrder })
  } catch (error) {
    console.error("Error placing order:", error)
    res.status(500).json({ message: "Server error placing order." })
  }
}

exports.verifyPayment = async (req, res) => {
  const { storeDb } = req // Get storeDb from middleware
  const { orderId, transactionId, paymentStatus } = req.body // Example parameters

  try {
    const Order = storeDb.model("Order", orderSchema)

    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ message: "Order not found." })
    }

    // In a real scenario, you would integrate with a payment gateway here
    // and verify the transaction ID and status with the gateway.
    // For this example, we'll just update based on provided status.

    order.paymentDetails = {
      transactionId,
      method: "Stripe (example)", // Or whatever method
    }
    order.paymentStatus = paymentStatus // 'paid', 'failed', etc.
    order.status = paymentStatus === "paid" ? "processing" : order.status // Update order status based on payment

    await order.save()

    res.status(200).json({ message: "Payment verification successful", order })
  } catch (error) {
    console.error("Error verifying payment:", error)
    res.status(500).json({ message: "Server error during payment verification." })
  }
}
