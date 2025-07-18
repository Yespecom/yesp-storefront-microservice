const express = require("express")
const router = express.Router({ mergeParams: true }) // mergeParams is important for accessing parent route params

const paymentController = require("../controllers/paymentController")

// This route will receive webhooks from payment gateways
// Example: POST /webhooks/stripe/STORE-1BH3OFH6
router.post("/:gatewayName", paymentController.handlePaymentWebhook)

module.exports = router
