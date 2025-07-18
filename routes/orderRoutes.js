const express = require("express")
const router = express.Router({ mergeParams: true }) // mergeParams is important for accessing parent route params
// connectStoreDb middleware is applied in server.js for all storefront routes

const orderController = require("../controllers/orderController")
const customerAuth = require("../middleware/customerAuth") // Import auth middleware

router.get("/orders", customerAuth, orderController.getOrders) // Auth required
router.post("/orders", customerAuth, orderController.placeOrder) // Auth required
router.post("/payment/verify", orderController.verifyPayment)

module.exports = router
