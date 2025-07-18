const productSchema = require("../models/tenant/Product") // Import schemas directly
const categorySchema = require("../models/tenant/Category") // Needed for population

exports.listProducts = async (req, res) => {
  const { storeDb } = req // Get the store-specific DB connection from middleware
  try {
    const Product = storeDb.model("Product", productSchema) // Define model on the specific connection
    const products = await Product.find({
      isActive: true,
      status: "published"
    }).populate("category", "name slug")
    
    res.status(200).json(products)
  } catch (error) {
    console.error("Error listing products:", error)
    res.status(500).json({ message: "Server error listing products." })
  }
}

exports.getProductDetails = async (req, res) => {
  const { storeDb } = req
  const { slug } = req.params // Use slug from URL param
  try {
    const Product = storeDb.model("Product", productSchema)
    const product = await Product.findOne({ slug, isActive: true }).populate("category", "name slug")
    if (!product) {
      return res.status(404).json({ message: "Product not found." })
    }
    res.status(200).json(product)
  } catch (error) {
    console.error("Error getting product details:", error)
    res.status(500).json({ message: "Server error getting product details." })
  }
}

exports.searchProducts = async (req, res) => {
  const { storeDb } = req
  const { q } = req.query // Get the search query from URL parameter 'q'

  if (!q) {
    return res.status(400).json({ message: "Search query 'q' is required." })
  }

  try {
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

    res.status(200).json(products)
  } catch (error) {
    console.error("Error searching products:", error)
    res.status(500).json({ message: "Server error searching products." })
  }
}
