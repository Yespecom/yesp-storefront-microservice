const express = require("express")
const router = express.Router({ mergeParams: true }) // mergeParams is important for accessing parent route params
// connectStoreDb middleware is applied in server.js for all storefront routes

const authController = require("../controllers/authController")

router.post("/register", authController.register)
router.post("/login", authController.login)

module.exports = router
