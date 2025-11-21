import mongoose from "mongoose";
import { Module } from "./src/models/Module.js";
import { Page } from "./src/models/Page.js";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Definir todas las páginas basadas en el archivo constants.ts
const pagesData = [
  // Gestión
  { name: "Empresas", path: "/gestion/empresas", description: "Gestión de empresas del sistema" },
  { name: "Dashboard Empresa", path: "/gestion/dashboard-empresa", description: "Panel de control de empresa" },
  { name: "Proveedores", path: "/gestion/proveedores", description: "Gestión de proveedores" },
  { name: "Roles", path: "/gestion/roles", description: "Gestión de roles y permisos" },
  { name: "Páginas", path: "/gestion/paginas", description: "Gestión de páginas del sistema" },
  { name: "Usuarios", path: "/gestion/usuarios", description: "Gestión de usuarios del sistema" },

  // Sucursal
  { name: "Sucursales", path: "/panel-de-control/sucursales", description: "Gestión de sucursales" },
  { name: "Nuevo Pedido", path: "/sucursal/nuevo-pedido", description: "Crear nuevo pedido" },
  { name: "Ventas", path: "/sucursal/ventas", description: "Gestión de ventas" },
  { name: "Reparto", path: "/sucursal/reparto", description: "Gestión de reparto" },
  { name: "Nuevo Gasto", path: "/sucursal/nuevo-gasto", description: "Registrar nuevo gasto" },
  { name: "Almacenes", path: "/sucursal/almacenes", description: "Gestión de almacenes" },
  { name: "Eventos", path: "/sucursal/eventos", description: "Gestión de eventos" },

  // Cajas
  { name: "Cajas Registradoras", path: "/ventas/cajas", description: "Gestión de cajas registradoras" },
  { name: "Historial Cajas", path: "/panel-de-control/cajas/historial", description: "Historial de movimientos de cajas" },

  // Producción
  { name: "Pizarrón de Ventas", path: "/produccion/pizarron-ventas", description: "Panel de producción y ventas" },

  // Usuarios (Personal)
  { name: "Clientes", path: "/panel/clientes", description: "Gestión de clientes" },
  { name: "Cajeros", path: "/panel/cajeros", description: "Gestión de cajeros" },
  { name: "Personal Producción", path: "/panel/produccion", description: "Gestión de personal de producción" },
  { name: "Repartidores", path: "/panel/repartidores", description: "Gestión de repartidores" },
  { name: "Gerentes", path: "/panel/gerentes", description: "Gestión de gerentes" },

  // Catálogos
  { name: "Productos", path: "/catalogos/productos", description: "Catálogo de productos" },
  { name: "Listas de Productos", path: "/catalogos/listas-productos", description: "Gestión de listas de productos" },
  { name: "Materiales", path: "/catalogos/materiales", description: "Catálogo de materiales" },
  { name: "Unidades de Medida", path: "/catalogos/unidades-medida", description: "Catálogo de unidades de medida" },
  { name: "Métodos de Pago", path: "/catalogos/payment-method", description: "Catálogo de métodos de pago" },
  { name: "Conceptos de Gastos", path: "/catalogos/conceptos-gastos", description: "Catálogo de conceptos de gastos" },
  { name: "Gastos", path: "/catalogos/gastos", description: "Gestión de gastos" },
  { name: "Compras", path: "/catalogos/compras", description: "Gestión de compras" },
  { name: "Colonias", path: "/catalogos/colonias", description: "Catálogo de colonias" },

  // Reportes
  { name: "Finanzas", path: "/finanzas/finanzas", description: "Reportes financieros" },
];

// Los 4 módulos básicos que cada página debe tener
const moduleTypes = [
  { name: "Ver", key: "ver", description: "Permite visualizar la información" },
  { name: "Crear", key: "crear", description: "Permite crear nuevos registros" },
  { name: "Editar", key: "editar", description: "Permite editar registros existentes" },
  { name: "Eliminar", key: "eliminar", description: "Permite eliminar registros" },
];

const createSeedData = async () => {
  try {
    console.log("🌱 Iniciando creación de seed para páginas y módulos...\n");

    // Limpiar datos existentes de páginas y módulos
    console.log("🗑️  Limpiando páginas y módulos existentes...");
    await Module.deleteMany({});
    await Page.deleteMany({});
    console.log("✅ Páginas y módulos eliminados\n");

    const allModules = [];
    let pageCount = 0;
    let moduleCount = 0;

    // Crear páginas y sus módulos
    console.log("📄 Creando páginas y módulos...\n");

    for (const pageData of pagesData) {
      // Crear la página
      const page = await Page.create({
        name: pageData.name,
        path: pageData.path,
        description: pageData.description,
        status: true,
      });

      pageCount++;
      console.log(`✓ Página creada: ${page.name} (${page.path})`);

      // Crear los 4 módulos para esta página
      const pageModules = [];
      for (const moduleType of moduleTypes) {
        const module = await Module.create({
          name: moduleType.key,
          description: `${moduleType.description} de ${pageData.name}`,
          page: page._id,
          status: true,
        });

        pageModules.push(module._id);
        allModules.push(module);
        moduleCount++;
      }

      // Actualizar la página con sus módulos
      page.modules = pageModules;
      await page.save();

      console.log(`  └─ ${moduleTypes.length} módulos creados para ${page.name}`);
    }

    console.log("═".repeat(60));
    console.log("🎉 SEED DE PÁGINAS COMPLETADO EXITOSAMENTE");
    console.log("═".repeat(60));
    console.log("\n📊 RESUMEN:");
    console.log(`  • ${pageCount} páginas creadas`);
    console.log(`  • ${moduleCount} módulos creados (${moduleTypes.length} por página: ver, crear, editar, eliminar)`);
    console.log("\n💡 NOTA: Los roles y usuarios deben ser creados por separado usando 'npm run seed'");
    console.log("═".repeat(60) + "\n");

  } catch (error) {
    console.error("\n❌ Error creando seed data:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB desconectado");
  }
};

const runSeed = async () => {
  await connectDB();
  await createSeedData();
  process.exit(0);
};

runSeed();
