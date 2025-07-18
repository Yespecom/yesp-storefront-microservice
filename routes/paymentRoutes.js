const express = require("express")
const router = express.Router({ mergeParams: true }) // mergeParams is important for accessing parent route params

const paymentController = require("../controllers/paymentController")
const customerAuth = require("../middleware/customerAuth") // Import auth middleware

// Route to get available payment gateways
router.get("/payment-gateways", paymentController.getPaymentGateways)

// Route to create a payment intent (requires authentication)
router.post("/payment-intents", customerAuth, paymentController.createPaymentIntent)

module.exports = router
