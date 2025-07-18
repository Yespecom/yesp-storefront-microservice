const productSchema = require("../models/tenant/Product") // Import schemas directly
const categorySchema = require("../models/tenant/Category") // Needed for population

exports.listProducts = async (req, res) => {
  const { storeDb } = req // Get the store-specific DB connection from middleware

  console.log(`[Product Controller] listProducts called for storeId: ${req.storeId}`)
  console.log(`[Product Controller] StoreDb connection state: ${storeDb ? storeDb.readyState : "null"}`)

  try {
    if (!storeDb) {
      console.error("[Product Controller] No storeDb connection available")
      return res.status(500).json({
        message: "Database connection not available",
        error: "STORE_DB_NOT_CONNECTED",
      })
    }

    const Product = storeDb.model("Product", productSchema) // Define model on the specific connection

    console.log(`[Product Controller] Querying products...`)
    const products = await Product.find({
      isActive: true,
      status: "published",
    }).populate("category", "name slug")

    console.log(`[Product Controller] Found ${products.length} products`)

    if (products.length === 0) {
      return res.status(200).json({
        message: "No products found for this store",
        products: [],
        count: 0,
      })
    }

    res.status(200).json({
      message: "Products retrieved successfully",
      products: products,
      count: products.length,
    })
  } catch (error) {
    console.error("Error listing products:", error)
    res.status(500).json({
      message: "Server error listing products.",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
}

exports.getProductDetails = async (req, res) => {
  const { storeDb } = req
  const { slug } = req.params // Use slug from URL param

  console.log(`[Product Controller] getProductDetails called for slug: ${slug}`)

  try {
    if (!storeDb) {
      return res.status(500).json({
        message: "Database connection not available",
        error: "STORE_DB_NOT_CONNECTED",
      })
    }

    const Product = storeDb.model("Product", productSchema)
    const product = await Product.findOne({ slug, isActive: true }).populate("category", "name slug")

    if (!product) {
      return res.status(404).json({ message: "Product not found." })
    }

    res.status(200).json({
      message: "Product retrieved successfully",
      product: product,
    })
  } catch (error) {
    console.error("Error getting product details:", error)
    res.status(500).json({
      message: "Server error getting product details.",
      error: error.message,
    })
  }
}

exports.searchProducts = async (req, res) => {
  const { storeDb } = req
  const { q } = req.query // Get the search query from URL parameter 'q'

  if (!q) {
    return res.status(400).json({ message: "Search query 'q' is required." })
  }

  console.log(`[Product Controller] searchProducts called for query: ${q}`)

  try {
    if (!storeDb) {
      return res.status(500).json({
        message: "Database connection not available",
        error: "STORE_DB_NOT_CONNECTED",
      })
    }

    const Product = storeDb.model("Product", productSchema)
    const searchTerm = new RegExp(q, "i") // 'i' for case-insensitive search

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: searchTerm } },
        { description: { $regex: searchTerm } },
        { slug: { $regex: searchTerm } },
      ],
    }).populate("category", "name slug")

    res.status(200).json({
      message: "Search completed successfully",
      products: products,
      count: products.length,
      searchTerm: q,
    })
  } catch (error) {
    console.error("Error searching products:", error)
    res.status(500).json({
      message: "Server error searching products.",
      error: error.message,
    })
  }
}
