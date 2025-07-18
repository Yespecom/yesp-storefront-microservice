const express = require("express")
const router = express.Router({ mergeParams: true }) // mergeParams is important for accessing parent route params

const productController = require("../controllers/productController")

router.get("/products", productController.listProducts)
router.get("/products/search", productController.searchProducts) // New: Search route
router.get("/products/:slug", productController.getProductDetails)

module.exports = router
