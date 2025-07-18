const express = require("express")
const router = express.Router({ mergeParams: true }) // mergeParams is important for accessing parent route params
// connectStoreDb middleware is applied in server.js for all storefront routes

const categoryController = require("../controllers/categoryController")

router.get("/categories", categoryController.listCategories)

module.exports = router
