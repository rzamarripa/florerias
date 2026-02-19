import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Configuración básica de Mongoose
    mongoose.set('autoCreate', true);
    mongoose.set('autoIndex', true);

    // Intentar conexión con configuración simplificada
    console.log("🔄 Connecting to MongoDB Atlas...");
    console.log("📝 Using connection string:", process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@'));
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Event listeners
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
    });

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    });
    
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    
    if (error.message.includes("ESERVFAIL") || error.message.includes("queryTxt")) {
      console.log("\n🔍 DNS Resolution Error Detected!");
      console.log("This is a known issue with MongoDB SRV records and some DNS configurations.");
      console.log("\n📋 Solution: Use a standard connection string instead of SRV.");
      console.log("\nTo get your standard connection string:");
      console.log("1. Go to MongoDB Atlas");
      console.log("2. Click 'Connect' on your cluster");
      console.log("3. Choose 'Connect your application'");
      console.log("4. Select 'MongoDB Driver' version 3.6 or earlier");
      console.log("5. Copy the connection string that starts with 'mongodb://' (not 'mongodb+srv://')");
      console.log("\nAlternatively, try these quick fixes:");
      console.log("• Change your DNS to 8.8.8.8 (Google) or 1.1.1.1 (Cloudflare)");
      console.log("• On Linux: sudo resolvectl flush-caches");
      console.log("• Restart your network connection");
    }
    
    process.exit(1);
  }
};

export default connectDB;
