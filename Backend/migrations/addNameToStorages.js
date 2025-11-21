import mongoose from "mongoose";
import { Storage } from "../src/models/Storage.js";
import { Branch } from "../src/models/Branch.js";
import dotenv from "dotenv";

dotenv.config();

const addNameToStorages = async () => {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado a MongoDB");

    // Obtener todos los almacenes
    const storages = await Storage.find().populate("branch", "branchName branchCode");

    console.log(`Encontrados ${storages.length} almacenes`);

    for (const storage of storages) {
      // Si el almacén ya tiene un nombre, omitir
      if (storage.name) {
        console.log(`Almacén ${storage._id} ya tiene nombre: ${storage.name}`);
        continue;
      }

      // Generar nombre basado en la sucursal
      let newName = "Almacén Principal";

      if (typeof storage.branch !== "string" && storage.branch) {
        newName = `Almacén ${storage.branch.branchName}`;
        if (storage.branch.branchCode) {
          newName = `Almacén ${storage.branch.branchCode}`;
        }
      }

      // Actualizar el almacén
      storage.name = newName;
      await storage.save();

      console.log(`Almacén ${storage._id} actualizado con nombre: ${newName}`);
    }

    console.log("Migración completada exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("Error en la migración:", error);
    process.exit(1);
  }
};

addNameToStorages();
