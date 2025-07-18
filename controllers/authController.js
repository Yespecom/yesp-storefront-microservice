const customerSchema = require("../models/tenant/Customer") // Import schema directly
const jwt = require("jsonwebtoken")

exports.register = async (req, res) => {
  const { storeDb } = req // Get the store-specific DB connection from middleware
  const { firstName, lastName, email, password } = req.body

  try {
    const Customer = storeDb.model("Customer", customerSchema) // Define model on the specific connection

    const customer = await Customer.findOne({ email })
    if (customer) {
      return res.status(400).json({ message: "Customer with this email already exists." })
    }

    const newCustomer = new Customer({ firstName, lastName, email, password })
    await newCustomer.save()

    // Generate JWT
    const token = jwt.sign(
      { userId: newCustomer._id, storeId: req.storeId, role: "customer" },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    )

    res.status(201).json({
      message: "Customer registered successfully",
      customer: { id: newCustomer._id, email: newCustomer.email },
      token,
    })
  } catch (error) {
    console.error("Error during customer registration:", error)
    res.status(500).json({ message: "Server error during registration." })
  }
}

exports.login = async (req, res) => {
  const { storeDb } = req // Get the store-specific DB connection from middleware
  const { email, password } = req.body

  try {
    const Customer = storeDb.model("Customer", customerSchema) // Define model on the specific connection

    const customer = await Customer.findOne({ email })
    if (!customer) {
      return res.status(400).json({ message: "Invalid credentials." })
    }

    const isMatch = await customer.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." })
    }

    // Generate JWT
    const token = jwt.sign({ userId: customer._id, storeId: req.storeId, role: "customer" }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    })

    res
      .status(200)
      .json({ message: "Logged in successfully", customer: { id: customer._id, email: customer.email }, token })
  } catch (error) {
    console.error("Error during customer login:", error)
    res.status(500).json({ message: "Server error during login." })
  }
}
