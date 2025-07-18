const categorySchema = require("../models/tenant/Category") // Import schema directly

exports.listCategories = async (req, res) => {
  const { storeDb } = req // Get the store-specific DB connection from middleware
  try {
    const Category = storeDb.model("Category", categorySchema) // Define model on the specific connection
    const categories = await Category.find({ isActive: true })
    res.status(200).json(categories)
  } catch (error) {
    console.error("Error listing categories:", error)
    res.status(500).json({ message: "Server error listing categories." })
  }
}
