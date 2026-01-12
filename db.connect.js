const mongoose = require("mongoose")

let isConnected = false

const initializeDatabase = async () => {
  if (isConnected) return

  await mongoose.connect(process.env.MONGODB)
  isConnected = true
  console.log("✅ MongoDB connected")
}

module.exports = { initializeDatabase }
