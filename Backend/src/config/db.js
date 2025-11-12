import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Deshabilitar transacciones explícitamente para MongoDB local sin réplica set
    mongoose.set('autoCreate', true);
    mongoose.set('autoIndex', true);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Asegurar que no se usen transacciones ni sesiones
      readPreference: 'primary',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

export default connectDB;
