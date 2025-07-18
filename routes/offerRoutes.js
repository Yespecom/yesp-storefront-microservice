const express = require("express")
const router = express.Router({ mergeParams: true }) // mergeParams is important for accessing parent route params
// connectStoreDb middleware is applied in server.js for all storefront routes

const offerController = require("../controllers/offerController")

router.get("/offers", offerController.listOffers)

module.exports = router
