import mongoose from "mongoose";
import { Role } from "./src/models/Roles.js";
import { User } from "./src/models/User.js";
import { Module } from "./src/models/Module.js";
import { Page } from "./src/models/Page.js";
import dotenv from "dotenv";

// Cargar variables de entorno (solo si no están ya definidas por Docker)
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: ".env.production" });
}

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
  { name: "Cajas de Redes Sociales", path: "/ventas/cajas-redes-sociales", description: "Gestión de cajas para redes sociales" },
  { name: "Historial Cajas", path: "/panel-de-control/cajas/historial", description: "Historial de movimientos de cajas" },

  // Producción
  { name: "Pizarrón de Producción", path: "/produccion/pizarron-ventas", description: "Panel de producción y ventas" },
  { name: "Pizarrón de Envío", path: "/produccion/pizarron-envio", description: "Panel de envíos y entregas" },
  { name: "Listado de Producción", path: "/ventas/listado-produccion", description: "Listado de órdenes en producción" },
  { name: "Ventas de Franquicias", path: "/ventas/ventas-empresas", description: "Gestión de ventas por franquicias" },

  // Usuarios (Personal)
  { name: "Clientes", path: "/panel/clientes", description: "Gestión de clientes" },
  { name: "Cajeros", path: "/panel/cajeros", description: "Gestión de cajeros" },
  { name: "Personal Producción", path: "/panel/produccion", description: "Gestión de personal de producción" },
  { name: "Repartidores", path: "/panel/repartidores", description: "Gestión de repartidores" },
  { name: "Gerentes", path: "/panel/gerentes", description: "Gestión de gerentes" },

  // Puntos y Tarjetas Digitales
  { name: "Tarjetas Digitales", path: "/admin/digital-cards", description: "Gestión de tarjetas digitales de clientes" },
  { name: "Configuración de Puntos", path: "/panel/config-puntos", description: "Configuración del sistema de puntos" },

  // Catálogos
  { name: "Etapas de Ventas", path: "/catalogos/etapas", description: "Catálogo de etapas del proceso de venta" },
  { name: "Productos", path: "/catalogos/productos", description: "Catálogo de productos" },
  { name: "Categorías de Productos", path: "/catalogos/categorias-productos", description: "Categorías para organizar productos" },
  { name: "Listas de Productos", path: "/catalogos/listas-productos", description: "Gestión de listas de productos" },
  { name: "Materiales", path: "/catalogos/materiales", description: "Catálogo de materiales" },
  { name: "Gestión de Materiales", path: "/catalogos/gestion-materiales", description: "Administración de inventario de materiales" },
  { name: "Unidades de Medida", path: "/catalogos/unidades-medida", description: "Catálogo de unidades de medida" },
  { name: "Métodos de Pago", path: "/catalogos/payment-method", description: "Catálogo de métodos de pago" },
  { name: "Conceptos de Gastos", path: "/catalogos/conceptos-gastos", description: "Catálogo de conceptos de gastos" },
  { name: "Gastos", path: "/catalogos/gastos", description: "Gestión de gastos" },
  { name: "Compras", path: "/catalogos/compras", description: "Gestión de compras" },
  { name: "Colonias", path: "/catalogos/colonias", description: "Catálogo de colonias" },

  // Reportes
  { name: "Finanzas", path: "/finanzas/finanzas", description: "Reportes financieros" },

  // E-commerce
  { name: "Diseño E-commerce", path: "/ecommerce/configuracion/diseno", description: "Configuración del diseño de la tienda en línea" },
  { name: "Catálogo E-commerce", path: "/ecommerce/catalogo", description: "Catálogo de productos para tienda en línea" },
];

// Los 4 módulos básicos que cada página debe tener
const moduleTypes = [
  { name: "Ver", key: "ver", description: "Permite visualizar la información" },
  { name: "Crear", key: "crear", description: "Permite crear nuevos registros" },
  { name: "Editar", key: "editar", description: "Permite editar registros existentes" },
  { name: "Eliminar", key: "eliminar", description: "Permite eliminar registros" },
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");
    console.log(`Database: ${process.env.MONGODB_URI.split("/").pop().split("?")[0]}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const createPagesAndModules = async () => {
  try {
    console.log("📄 Creando/actualizando páginas y módulos...\n");

    const allModules = [];
    let pageCount = 0;
    let moduleCount = 0;

    for (const pageData of pagesData) {
      // Crear o actualizar la página
      const page = await Page.findOneAndUpdate(
        { name: pageData.name },
        {
          name: pageData.name,
          path: pageData.path,
          description: pageData.description,
          status: true,
        },
        { upsert: true, new: true }
      );

      pageCount++;
      console.log(`✓ Página: ${page.name} (${page.path})`);

      // Crear o actualizar los 4 módulos para esta página
      const pageModules = [];
      for (const moduleType of moduleTypes) {
        const module = await Module.findOneAndUpdate(
          { name: moduleType.key, page: page._id },
          {
            name: moduleType.key,
            description: `${moduleType.description} de ${pageData.name}`,
            page: page._id,
            status: true,
          },
          { upsert: true, new: true }
        );

        pageModules.push(module._id);
        allModules.push(module);
        moduleCount++;
      }

      // Actualizar la página con sus módulos
      page.modules = pageModules;
      await page.save();

      console.log(`  └─ ${moduleTypes.length} módulos para ${page.name}`);
    }

    console.log(`\n✓ ${pageCount} páginas procesadas`);
    console.log(`✓ ${moduleCount} módulos procesados\n`);

    return allModules.map(m => m._id);
  } catch (error) {
    console.error("❌ Error creando páginas y módulos:", error);
    throw error;
  }
};

const createSuperAdmin = async () => {
  try {
    console.log("🌱 Iniciando seed de producción...\n");

    // Crear páginas y módulos
    const allModuleIds = await createPagesAndModules();

    // Check if SuperAdmin role exists
    let superAdminRole = await Role.findOne({ name: "Super Admin" });

    if (!superAdminRole) {
      // Create Super Admin role con todos los módulos
      superAdminRole = await Role.create({
        name: "Super Admin",
        description: "Rol con permisos totales del sistema",
        modules: allModuleIds,
        estatus: true,
      });
      console.log("✓ Super Admin role creado con todos los permisos");
    } else {
      // Actualizar el rol con todos los módulos
      superAdminRole.modules = allModuleIds;
      await superAdminRole.save();
      console.log("✓ Super Admin role actualizado con todos los permisos");
    }

    // Crear o actualizar rol Administrador (con acceso a puntos y ecommerce)
    let adminRole = await Role.findOne({ name: "Administrador" });

    if (!adminRole) {
      adminRole = await Role.create({
        name: "Administrador",
        description: "Rol de administrador con acceso completo incluyendo puntos y ecommerce",
        modules: allModuleIds,
        estatus: true,
      });
      console.log("✓ Administrador role creado con todos los permisos");
    } else {
      adminRole.modules = allModuleIds;
      await adminRole.save();
      console.log("✓ Administrador role actualizado con todos los permisos");
    }

    // Crear roles adicionales básicos
    const basicRoles = [
      { name: "Distribuidor", description: "Rol para distribuidores del sistema" },
      { name: "Gerente", description: "Rol para gerentes de sucursales" },
      { name: "Cajero", description: "Rol para cajeros" },
      { name: "Redes", description: "Rol para personal de redes sociales" },
      { name: "Producción", description: "Rol para personal de producción" },
    ];

    for (const roleData of basicRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        await Role.create({
          name: roleData.name,
          description: roleData.description,
          modules: [],
          estatus: true,
        });
        console.log(`✓ Rol ${roleData.name} creado`);
      } else {
        console.log(`ℹ️ Rol ${roleData.name} ya existe`);
      }
    }

    // Check if admin user exists
    const existingAdmin = await User.findOne({ username: "admin" });

    if (existingAdmin) {
      console.log("⚠️  Usuario 'admin' ya existe. Saltando creación.");
    } else {
      // Create SuperAdmin user
      await User.create({
        username: "admin",
        email: "admin@system.com",
        phone: "000-0000",
        password: "123qwe",
        profile: {
          name: "Admin",
          lastName: "System",
          fullName: "Admin System",
          path: "/admin/profile",
          estatus: true,
        },
        role: superAdminRole._id,
      });

      console.log("✓ Usuario SuperAdmin creado exitosamente");
    }

    console.log("\n" + "═".repeat(60));
    console.log("🎉 SEED DE PRODUCCIÓN COMPLETADO EXITOSAMENTE");
    console.log("═".repeat(60));
    console.log("\n📊 RESUMEN:");
    console.log(`  • ${pagesData.length} páginas creadas`);
    console.log(`  • ${pagesData.length * moduleTypes.length} módulos creados (4 por página)`);
    console.log(`  • 7 roles creados:`);
    console.log(`    - Super Admin (acceso total)`);
    console.log(`    - Administrador (acceso total + puntos + ecommerce)`);
    console.log(`    - Distribuidor, Gerente, Cajero, Redes, Producción`);
    console.log(`  • 1 usuario admin`);
    console.log("\n=== CREDENCIALES ===");
    console.log("Username: admin");
    console.log("Password: 123qwe");
    console.log("Email: admin@system.com");
    console.log("═".repeat(60) + "\n");
  } catch (error) {
    console.error("❌ Error en el seed:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB desconectado");
  }
};

const runSeed = async () => {
  await connectDB();
  await createSuperAdmin();
  process.exit(0);
};

runSeed();
