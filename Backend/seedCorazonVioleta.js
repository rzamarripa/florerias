import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/Product.js";
import Material from "./src/models/Material.js";
import Unit from "./src/models/Unit.js";
import { Company } from "./src/models/Company.js";
import ProductList from "./src/models/ProductList.js";

// Cargar variables de entorno de producción
dotenv.config({ path: ".env.production" });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const seedCorazonVioleta = async () => {
  try {
    console.log("🌸 Iniciando seed para Corazón de Violeta...\n");

    // IDs proporcionados directamente (como ObjectId)
    const companyId = new mongoose.Types.ObjectId("693437d560c12ffa20571143");
    const branchId = new mongoose.Types.ObjectId("69385aaa946ecb0c67a5bf7d");

    // 1. Verificar que la empresa existe
    const company = await Company.findById(companyId);

    if (!company) {
      console.error("❌ No se encontró la empresa con ID:", companyId);
      process.exit(1);
    }

    console.log(`✅ Empresa encontrada: ${company.legalName} (${company.tradeName || 'N/A'})`);
    console.log(`   ID: ${company._id}`);
    console.log(`   Sucursal: ${branchId}\n`);

    // 2. Crear o buscar las unidades necesarias
    console.log("📏 Creando/buscando unidades...");

    const unitsData = [
      { name: "Pieza", abbreviation: "pza" },
      { name: "Tallo", abbreviation: "tallo" },
      { name: "Metro", abbreviation: "m" },
      { name: "Rollo", abbreviation: "rollo" },
      { name: "Paquete", abbreviation: "paq" }
    ];

    const units = {};
    for (const unitData of unitsData) {
      let unit = await Unit.findOne({ name: unitData.name });
      if (!unit) {
        unit = await Unit.create(unitData);
        console.log(`   ✅ Unidad creada: ${unit.name}`);
      } else {
        console.log(`   ℹ️ Unidad existente: ${unit.name}`);
      }
      units[unitData.name] = unit;
    }

    // 3. Crear materiales para florería
    console.log("\n🌷 Creando materiales...");

    const materialsData = [
      { name: "Rosa roja premium", unit: units["Tallo"]._id, cost: 15, price: 25, piecesPerPackage: 1, description: "Rosa roja de tallo largo premium" },
      { name: "Rosa blanca", unit: units["Tallo"]._id, cost: 12, price: 20, piecesPerPackage: 1, description: "Rosa blanca de tallo largo" },
      { name: "Rosa rosa", unit: units["Tallo"]._id, cost: 14, price: 22, piecesPerPackage: 1, description: "Rosa rosa claro" },
      { name: "Girasol", unit: units["Tallo"]._id, cost: 18, price: 30, piecesPerPackage: 1, description: "Girasol grande" },
      { name: "Lirio blanco", unit: units["Tallo"]._id, cost: 25, price: 40, piecesPerPackage: 1, description: "Lirio oriental blanco" },
      { name: "Gerbera", unit: units["Tallo"]._id, cost: 10, price: 18, piecesPerPackage: 1, description: "Gerbera de colores variados" },
      { name: "Tulipán", unit: units["Tallo"]._id, cost: 20, price: 35, piecesPerPackage: 1, description: "Tulipán holandés" },
      { name: "Clavel", unit: units["Tallo"]._id, cost: 5, price: 10, piecesPerPackage: 1, description: "Clavel estándar" },
      { name: "Eucalipto", unit: units["Tallo"]._id, cost: 8, price: 15, piecesPerPackage: 1, description: "Rama de eucalipto para follaje" },
      { name: "Gypsophila (Nube)", unit: units["Paquete"]._id, cost: 25, price: 45, piecesPerPackage: 1, description: "Paquete de gypsophila" },
      { name: "Listón satinado", unit: units["Metro"]._id, cost: 5, price: 10, piecesPerPackage: 1, description: "Listón satinado 2.5cm ancho" },
      { name: "Papel kraft", unit: units["Pieza"]._id, cost: 8, price: 15, piecesPerPackage: 10, description: "Hoja de papel kraft grande" },
      { name: "Celofán transparente", unit: units["Metro"]._id, cost: 12, price: 20, piecesPerPackage: 1, description: "Rollo de celofán transparente" },
      { name: "Oasis (esponja floral)", unit: units["Pieza"]._id, cost: 15, price: 25, piecesPerPackage: 1, description: "Bloque de oasis húmedo" },
      { name: "Base de madera", unit: units["Pieza"]._id, cost: 30, price: 50, piecesPerPackage: 1, description: "Base decorativa de madera" },
      { name: "Florero de vidrio", unit: units["Pieza"]._id, cost: 45, price: 80, piecesPerPackage: 1, description: "Florero cilíndrico de vidrio" },
      { name: "Tarjeta con mensaje", unit: units["Pieza"]._id, cost: 3, price: 8, piecesPerPackage: 1, description: "Tarjeta para mensaje personalizado" },
    ];

    const materials = {};
    for (const matData of materialsData) {
      let material = await Material.findOne({ name: matData.name });
      if (!material) {
        material = await Material.create(matData);
        console.log(`   ✅ Material creado: ${material.name}`);
      } else {
        console.log(`   ℹ️ Material existente: ${material.name}`);
      }
      materials[matData.name] = material;
    }

    // 4. Crear los 5 productos con sus insumos
    console.log("\n💐 Creando productos...");

    const productsData = [
      {
        nombre: "Ramo Romántico de Rosas",
        unidad: "pieza",
        descripcion: "Elegante ramo de 12 rosas rojas premium con eucalipto y gypsophila, envuelto en papel kraft con listón satinado. Perfecto para ocasiones especiales.",
        labour: 50,
        totalVenta: 450,
        insumos: [
          { material: "Rosa roja premium", cantidad: 12 },
          { material: "Eucalipto", cantidad: 5 },
          { material: "Gypsophila (Nube)", cantidad: 0.5 },
          { material: "Papel kraft", cantidad: 2 },
          { material: "Listón satinado", cantidad: 1.5 },
          { material: "Tarjeta con mensaje", cantidad: 1 },
        ]
      },
      {
        nombre: "Centro de Mesa Primaveral",
        unidad: "pieza",
        descripcion: "Hermoso centro de mesa con gerberas, girasoles y follaje de eucalipto en base de madera con oasis. Ideal para decoración de eventos.",
        labour: 80,
        totalVenta: 550,
        insumos: [
          { material: "Gerbera", cantidad: 8 },
          { material: "Girasol", cantidad: 3 },
          { material: "Eucalipto", cantidad: 6 },
          { material: "Base de madera", cantidad: 1 },
          { material: "Oasis (esponja floral)", cantidad: 1 },
        ]
      },
      {
        nombre: "Bouquet Elegancia Blanca",
        unidad: "pieza",
        descripcion: "Sofisticado bouquet de lirios blancos con rosas blancas y gypsophila, presentado en celofán con listón plateado. Perfecto para bodas y eventos formales.",
        labour: 70,
        totalVenta: 680,
        insumos: [
          { material: "Lirio blanco", cantidad: 5 },
          { material: "Rosa blanca", cantidad: 6 },
          { material: "Gypsophila (Nube)", cantidad: 0.5 },
          { material: "Celofán transparente", cantidad: 2 },
          { material: "Listón satinado", cantidad: 2 },
          { material: "Tarjeta con mensaje", cantidad: 1 },
        ]
      },
      {
        nombre: "Arreglo Tulipanes Holandeses",
        unidad: "pieza",
        descripcion: "Distinguido arreglo de tulipanes holandeses en florero de vidrio con base de eucalipto. Disponible en colores variados.",
        labour: 60,
        totalVenta: 520,
        insumos: [
          { material: "Tulipán", cantidad: 10 },
          { material: "Eucalipto", cantidad: 4 },
          { material: "Florero de vidrio", cantidad: 1 },
          { material: "Tarjeta con mensaje", cantidad: 1 },
        ]
      },
      {
        nombre: "Ramo Mixto Alegría",
        unidad: "pieza",
        descripcion: "Colorido ramo mixto con rosas rosas, claveles y gerberas, decorado con gypsophila y envuelto en papel kraft. Perfecto para cualquier celebración.",
        labour: 45,
        totalVenta: 320,
        insumos: [
          { material: "Rosa rosa", cantidad: 6 },
          { material: "Clavel", cantidad: 8 },
          { material: "Gerbera", cantidad: 4 },
          { material: "Gypsophila (Nube)", cantidad: 0.3 },
          { material: "Papel kraft", cantidad: 2 },
          { material: "Listón satinado", cantidad: 1 },
          { material: "Tarjeta con mensaje", cantidad: 1 },
        ]
      }
    ];

    const createdProducts = [];

    for (const prodData of productsData) {
      // Verificar si el producto ya existe
      let product = await Product.findOne({ nombre: prodData.nombre });

      if (product) {
        console.log(`   ℹ️ Producto existente: ${product.nombre}`);
        createdProducts.push(product);
        continue;
      }

      // Construir los insumos con la referencia al material
      const insumos = prodData.insumos.map(ins => {
        const mat = materials[ins.material];
        const unitDoc = unitsData.find(u => u.name === mat.unit?.name) || { abbreviation: 'pza' };

        // Buscar la unidad del material
        const materialUnit = Object.values(units).find(u => u._id.equals(mat.unit));

        return {
          materialId: mat._id,
          nombre: mat.name,
          cantidad: ins.cantidad,
          unidad: materialUnit?.abbreviation || 'pza',
          importeCosto: mat.cost * ins.cantidad,
          importeVenta: mat.price * ins.cantidad
        };
      });

      product = await Product.create({
        nombre: prodData.nombre,
        unidad: prodData.unidad,
        descripcion: prodData.descripcion,
        labour: prodData.labour,
        totalVenta: prodData.totalVenta,
        insumos: insumos,
        estatus: true
      });

      console.log(`   ✅ Producto creado: ${product.nombre}`);
      console.log(`      - Costo total: $${product.totalCosto.toFixed(2)}`);
      console.log(`      - Precio venta: $${product.totalVenta.toFixed(2)}`);
      console.log(`      - Margen: $${(product.totalVenta - product.totalCosto).toFixed(2)}`);

      createdProducts.push(product);
    }

    // 5. Crear ProductList para asociar los productos a la empresa
    console.log("\n📋 Creando lista de productos para la empresa...");

    // Verificar si ya existe una lista
    let productList = await ProductList.findOne({
      company: company._id,
      branch: branchId,
      name: "Catálogo Principal Corazón de Violeta"
    });

    if (productList) {
      console.log(`   ℹ️ Lista de productos existente, actualizando...`);

      // Actualizar productos en la lista existente
      productList.products = createdProducts.map(p => ({
        productId: p._id,
        nombre: p.nombre,
        unidad: p.unidad,
        descripcion: p.descripcion,
        orden: p.orden || 0,
        imagen: p.imagen || '',
        insumos: p.insumos,
        cantidad: 1,
        totalCosto: p.totalCosto,
        totalVenta: p.totalVenta,
        labour: p.labour,
        estatus: p.estatus,
        productCategory: p.productCategory
      }));
      productList.expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 año
      await productList.save();
      console.log(`   ✅ Lista de productos actualizada`);
    } else {
      // Crear nueva lista
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 1); // Expira en 1 año

      productList = await ProductList.create({
        name: "Catálogo Principal Corazón de Violeta",
        company: company._id,
        branch: branchId,
        expirationDate: expirationDate,
        products: createdProducts.map(p => ({
          productId: p._id,
          nombre: p.nombre,
          unidad: p.unidad,
          descripcion: p.descripcion,
          orden: p.orden || 0,
          imagen: p.imagen || '',
          insumos: p.insumos,
          cantidad: 1,
          totalCosto: p.totalCosto,
          totalVenta: p.totalVenta,
          labour: p.labour,
          estatus: p.estatus,
          productCategory: p.productCategory
        })),
        status: true
      });
      console.log(`   ✅ Lista de productos creada: ${productList.name}`);
    }

    // Resumen final
    console.log("\n" + "=".repeat(60));
    console.log("🌸 SEED COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(60));
    console.log(`\n📊 Resumen:`);
    console.log(`   - Empresa: ${company.tradeName || company.legalName}`);
    console.log(`   - Unidades: ${Object.keys(units).length}`);
    console.log(`   - Materiales: ${Object.keys(materials).length}`);
    console.log(`   - Productos creados: ${createdProducts.length}`);
    console.log(`   - Lista de productos: ${productList.name}`);

    console.log(`\n💐 Productos disponibles:`);
    createdProducts.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.nombre}`);
      console.log(`      Precio: $${p.totalVenta} | Costo: $${p.totalCosto.toFixed(2)} | Margen: $${(p.totalVenta - p.totalCosto).toFixed(2)}`);
    });

  } catch (error) {
    console.error("❌ Error durante el seed:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 MongoDB desconectado");
  }
};

const runSeed = async () => {
  await connectDB();
  await seedCorazonVioleta();
  process.exit(0);
};

runSeed();
