const offerSchema = require("../models/tenant/Offer") // Import schema directly

exports.listOffers = async (req, res) => {
  const { storeDb } = req // Get the store-specific DB connection from middleware
  try {
    const Offer = storeDb.model("Offer", offerSchema) // Define model on the specific connection
    const now = new Date()
    const offers = await Offer.find({
      isActive: true,
      validFrom: { $lte: now },
      $or: [{ validTo: { $gte: now } }, { validTo: null }], // Offer is valid if validTo is in future or null
    })
    res.status(200).json(offers)
  } catch (error) {
    console.error("Error listing offers:", error)
    res.status(500).json({ message: "Server error listing offers." })
  }
}
