require("dotenv").config()
const express = require("express")
const cors = require("cors")

const { connectMainDB } = require("./config/db") // Re-import connectMainDB
// Import routes
const authRoutes = require("./routes/authRoutes")
const productRoutes = require("./routes/productRoutes")
const categoryRoutes = require("./routes/categoryRoutes")
const offerRoutes = require("./routes/offerRoutes")
const orderRoutes = require("./routes/orderRoutes")
const paymentRoutes = require("./routes/paymentRoutes")
const webhookRoutes = require("./routes/webhookRoutes")

// Import the new store database connection middleware
const connectStoreDb = require("./middleware/connectStoreDb")

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Middleware to extract storeId from URL and attach to request for storefront APIs
app.use("/store/:storeId", (req, res, next) => {
  const { storeId } = req.params
  if (!storeId) {
    return res.status(400).json({ message: "Store ID is required in the URL." })
  }
  req.storeId = storeId
  next()
})

// API Routes for storefront (user-facing)
// All routes are prefixed with /store/:storeId/api/storefront
app.use("/store/:storeId/api/storefront", connectStoreDb) // Apply the new middleware
app.use("/store/:storeId/api/storefront", authRoutes)
app.use("/store/:storeId/api/storefront", productRoutes)
app.use("/store/:storeId/api/storefront", categoryRoutes)
app.use("/store/:storeId/api/storefront", offerRoutes)
app.use("/store/:storeId/api/storefront", orderRoutes)
app.use("/store/:storeId/api/storefront", paymentRoutes)

// Webhook Routes (gateway-facing)
app.use("/webhooks/:gatewayName/:storeId", (req, res, next) => {
  const { storeId } = req.params
  if (!storeId) {
    return res.status(400).json({ message: "Store ID is required in the webhook URL." })
  }
  req.storeId = storeId // Attach storeId to request for connectStoreDb
  next()
})
app.use("/webhooks/:gatewayName/:storeId", connectStoreDb) // Connect to the store DB for webhooks
app.use("/webhooks/:gatewayName/:storeId", webhookRoutes) // Mount webhook routes

// Basic health check route
app.get("/", (req, res) => {
  res.send("Storefront Microservice is running!")
})

// Error handling middleware (optional, but good practice)
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send("Something broke!")
})

const PORT = process.env.PORT || 5012

// Connect to the main database before starting the server
connectMainDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Storefront Microservice running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("Failed to connect to main database:", err)
    process.exit(1) // Exit if main DB connection fails
  })
