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

// Add debugging middleware
app.use("/store/:storeId/api/storefront", (req, res, next) => {
  console.log(`[DEBUG] Storefront API Request: ${req.method} ${req.originalUrl}`)
  console.log(`[DEBUG] StoreId: ${req.storeId}`)
  console.log(`[DEBUG] StoreDb connected: ${!!req.storeDb}`)
  next()
})

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
  res.json({
    message: "YESP Storefront Microservice is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  })
})

// Health check for specific store
app.get("/store/:storeId", (req, res) => {
  const { storeId } = req.params
  res.json({
    message: `Welcome to YESP Studio API Gateway!`,
    storeId: storeId,
    availableEndpoints: [
      `GET /store/${storeId}/api/storefront/products - List all products`,
      `GET /store/${storeId}/api/storefront/products/:slug - Get product details`,
      `GET /store/${storeId}/api/storefront/products/search?q=term - Search products`,
      `GET /store/${storeId}/api/storefront/categories - List all categories`,
      `GET /store/${storeId}/api/storefront/offers - List active offers`,
      `POST /store/${storeId}/api/storefront/register - Register customer`,
      `POST /store/${storeId}/api/storefront/login - Login customer`,
      `GET /store/${storeId}/api/storefront/orders - Get customer orders (auth required)`,
      `POST /store/${storeId}/api/storefront/orders - Place new order (auth required)`,
      `GET /store/${storeId}/api/storefront/payment-gateways - Get available payment gateways`,
      `POST /store/${storeId}/api/storefront/payment-intents - Create payment intent (auth required)`,
    ],
    timestamp: new Date().toISOString(),
  })
})

// API info endpoint for storefront (move this AFTER the route handlers)
app.get("/store/:storeId/api/storefront", connectStoreDb, (req, res) => {
  const { storeId } = req.params
  res.json({
    message: `YESP Studio Storefront API for Store: ${storeId}`,
    version: "1.0.0",
    endpoints: {
      products: {
        list: `GET /store/${storeId}/api/storefront/products`,
        details: `GET /store/${storeId}/api/storefront/products/:slug`,
        search: `GET /store/${storeId}/api/storefront/products/search?q=term`,
      },
      categories: {
        list: `GET /store/${storeId}/api/storefront/categories`,
      },
      offers: {
        list: `GET /store/${storeId}/api/storefront/offers`,
      },
      auth: {
        register: `POST /store/${storeId}/api/storefront/register`,
        login: `POST /store/${storeId}/api/storefront/login`,
      },
      orders: {
        list: `GET /store/${storeId}/api/storefront/orders (requires auth)`,
        create: `POST /store/${storeId}/api/storefront/orders (requires auth)`,
      },
      payments: {
        gateways: `GET /store/${storeId}/api/storefront/payment-gateways`,
        intent: `POST /store/${storeId}/api/storefront/payment-intents (requires auth)`,
      },
    },
    authentication: {
      note: "Include 'Authorization: Bearer <token>' header for protected routes",
      loginEndpoint: `POST /store/${storeId}/api/storefront/login`,
    },
    timestamp: new Date().toISOString(),
  })
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
