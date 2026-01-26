import mongoose from "mongoose";
import { Role } from "./src/models/Roles.js";
import { User } from "./src/models/User.js";
import { Module } from "./src/models/Module.js";
import { Page } from "./src/models/Page.js";
import { Client } from "./src/models/Client.js";

// CONEXIÓN DIRECTA A LA BASE DE DATOS DE PRODUCCIÓN
const PRODUCTION_MONGODB_URI = "mongodb+srv://root:nuevapassword12345@cluster0.sg6ov.mongodb.net/produccion?retryWrites=true&w=majority&appName=Cluster0";

const connectDB = async () => {
  try {
    console.log("Conectando a la base de datos de PRODUCCIÓN...");
    await mongoose.connect(PRODUCTION_MONGODB_URI);
    console.log("✅ Conectado a MongoDB PRODUCCIÓN (base: produccion)");
  } catch (error) {
    console.error("❌ Error de conexión a MongoDB:", error);
    process.exit(1);
  }
};

const createSeedData = async () => {
  try {
    console.log("\n🌱 INICIANDO SEED EN BASE DE DATOS DE PRODUCCIÓN 🌱\n");
    console.log("⚠️  ADVERTENCIA: Esto plantará datos en la base de datos 'produccion'");
    console.log("━".repeat(60));

    // Define todas las páginas basadas en constants.ts del frontend
    const pagesData = [
      // Gestión
      { name: "Empresas", path: "/gestion/empresas", description: "Gestión de empresas del sistema" },
      { name: "Dashboard Empresa", path: "/gestion/dashboard-empresa", description: "Panel de control de empresa" },
      { name: "Dashboard Distribuidor", path: "/gestion/empresas/dashboard", description: "Dashboard para distribuidores" },
      { name: "Proveedores", path: "/gestion/proveedores", description: "Gestión de proveedores" },
      { name: "Roles", path: "/gestion/roles", description: "Gestión de roles y permisos" },
      { name: "Páginas", path: "/gestion/paginas", description: "Gestión de páginas del sistema" },
      { name: "Usuarios", path: "/gestion/usuarios", description: "Gestión de usuarios del sistema" },
      
      // Sucursales
      { name: "Sucursales", path: "/panel-de-control/sucursales", description: "Gestión de sucursales" },
      { name: "Nuevo Pedido", path: "/sucursal/nuevo-pedido", description: "Crear nuevo pedido" },
      { name: "Ventas", path: "/sucursal/ventas", description: "Gestión de ventas" },
      { name: "Reparto", path: "/sucursal/reparto", description: "Gestión de reparto y entregas" },
      { name: "Almacenes", path: "/sucursal/almacenes", description: "Gestión de almacenes" },
      { name: "Eventos", path: "/sucursal/eventos", description: "Gestión de eventos" },
      
      // Producción
      { name: "Listado de Producción", path: "/ventas/listado-produccion", description: "Listado de órdenes de producción" },
      { name: "Ventas de Franquicias", path: "/ventas/ventas-empresas", description: "Gestión de ventas de franquicias" },
      { name: "Pizarrón de Producción", path: "/produccion/pizarron-ventas", description: "Panel de control de producción" },
      { name: "Pizarrón de Envío", path: "/produccion/pizarron-envio", description: "Panel de control de envíos" },
      
      // Cajas
      { name: "Historial de Cajas", path: "/panel-de-control/cajas/historial", description: "Historial de movimientos de cajas" },
      { name: "Cajas Registradoras", path: "/ventas/cajas", description: "Gestión de cajas registradoras" },
      { name: "Cajas de Redes", path: "/ventas/cajas-redes-sociales", description: "Gestión de cajas de redes sociales" },
      
      // Panel de usuarios
      { name: "Clientes", path: "/panel/clientes", description: "Gestión de clientes" },
      { name: "Tarjetas Digitales", path: "/admin/digital-cards", description: "Gestión de tarjetas digitales" },
      { name: "Configuración de Puntos", path: "/panel/config-puntos", description: "Configuración del sistema de puntos" },
      { name: "Cajeros", path: "/panel/cajeros", description: "Gestión de cajeros" },
      { name: "Personal de Producción", path: "/panel/produccion", description: "Gestión de personal de producción" },
      { name: "Repartidores", path: "/panel/repartidores", description: "Gestión de repartidores" },
      { name: "Gerentes", path: "/panel/gerentes", description: "Gestión de gerentes" },
      
      // Catálogos
      { name: "Etapas de Ventas", path: "/catalogos/etapas", description: "Catálogo de etapas de ventas" },
      { name: "Productos", path: "/catalogos/productos", description: "Catálogo de productos" },
      { name: "Categorías de Productos", path: "/catalogos/categorias-productos", description: "Gestión de categorías de productos" },
      { name: "Listas de Productos", path: "/catalogos/listas-productos", description: "Gestión de listas de productos" },
      { name: "Materiales", path: "/catalogos/materiales", description: "Catálogo de materiales" },
      { name: "Gestión de Materiales", path: "/catalogos/gestion-materiales", description: "Gestión avanzada de materiales" },
      { name: "Unidades de Medida", path: "/catalogos/unidades-medida", description: "Catálogo de unidades de medida" },
      { name: "Métodos de Pago", path: "/catalogos/payment-method", description: "Catálogo de métodos de pago" },
      { name: "Conceptos de Gastos", path: "/catalogos/conceptos-gastos", description: "Catálogo de conceptos de gastos" },
      { name: "Colonias", path: "/catalogos/colonias", description: "Catálogo de colonias" },
      { name: "Gastos", path: "/catalogos/gastos", description: "Gestión de gastos" },
      { name: "Compras", path: "/catalogos/compras", description: "Gestión de compras" },
      
      // Reportes
      { name: "Finanzas", path: "/finanzas/finanzas", description: "Reportes financieros" },
    ];

    // Los 4 módulos básicos que cada página debe tener
    const moduleTypes = [
      { name: "Ver", key: "ver" },
      { name: "Crear", key: "crear" },
      { name: "Editar", key: "editar" },
      { name: "Eliminar", key: "eliminar" },
    ];

    // Limpiar colecciones existentes
    console.log("\n🗑️  Limpiando datos existentes...");
    await Module.deleteMany({});
    await Page.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});
    await Client.deleteMany({});
    console.log("✅ Colecciones limpiadas");

    // Crear páginas y sus módulos
    const allPages = [];
    const allModules = [];
    
    console.log(`\n📄 Creando ${pagesData.length} páginas con sus módulos...`);
    
    for (const pageData of pagesData) {
      // Crear la página
      const page = await Page.create({
        name: pageData.name,
        path: pageData.path,
        description: pageData.description,
        status: true,
      });
      allPages.push(page);
      
      // Crear los 4 módulos para esta página
      const pageModules = [];
      for (const moduleType of moduleTypes) {
        const module = await Module.create({
          name: moduleType.key, // Solo 'ver', 'crear', 'editar', 'eliminar'
          description: `Permite ${moduleType.key} en ${pageData.name}`,
          page: page._id,
          status: true,
        });
        pageModules.push(module._id);
        allModules.push(module);
      }
      
      // Actualizar la página con sus módulos
      page.modules = pageModules;
      await page.save();
      
      console.log(`✓ ${page.name} - ${moduleTypes.length} módulos`);
    }

    console.log(`\n✅ ${allPages.length} páginas y ${allModules.length} módulos creados!\n`);

    // Crear Super Admin role con TODOS los permisos
    console.log("👤 Creando roles...");
    const superAdminRole = await Role.create({
      name: "Super Admin",
      description: "Rol con permisos totales del sistema",
      modules: allModules.map(m => m._id), // Todos los módulos
      estatus: true,
    });
    console.log("✓ Super Admin - Acceso total");

    // Crear rol Administrador con permisos administrativos
    const adminModules = allModules.filter(m => {
      const module = allModules.find(mod => mod._id.equals(m._id));
      const page = allPages.find(p => p._id.equals(module.page));
      return page && (
        page.path.includes('/gestion/') ||
        page.path.includes('/panel-de-control/') ||
        page.path.includes('/admin/') ||
        page.path.includes('/finanzas/')
      );
    });
    
    const adminRole = await Role.create({
      name: "Administrador",
      description: "Rol con permisos administrativos",
      modules: adminModules.map(m => m._id),
      estatus: true,
    });
    console.log("✓ Administrador");

    // Crear rol Distribuidor
    const distributorModules = allModules.filter(m => {
      const module = allModules.find(mod => mod._id.equals(m._id));
      const page = allPages.find(p => p._id.equals(module.page));
      return page && (
        page.path === '/gestion/empresas/dashboard' || // Dashboard para el Distribuidor
        page.path === '/sucursal/reparto' ||
        page.path === '/panel/repartidores' ||
        page.path === '/produccion/pizarron-envio' ||
        page.path === '/panel/clientes' ||
        page.path === '/catalogos/colonias'
      );
    });

    const distributorRole = await Role.create({
      name: "Distribuidor",
      description: "Rol para distribuidores del sistema",
      modules: distributorModules.map(m => m._id),
      estatus: true,
    });
    console.log("✓ Distribuidor");

    // Crear rol Gerente
    const managerModules = allModules.filter(m => {
      const module = allModules.find(mod => mod._id.equals(m._id));
      const page = allPages.find(p => p._id.equals(module.page));
      return page && (
        page.path.includes('/sucursal/') ||
        page.path.includes('/ventas/') ||
        page.path.includes('/panel/') ||
        page.path.includes('/catalogos/') ||
        page.path.includes('/produccion/') ||
        page.path === '/finanzas/finanzas'
      );
    });

    const managerRole = await Role.create({
      name: "Gerente",
      description: "Rol para gerentes de sucursales",
      modules: managerModules.map(m => m._id),
      estatus: true,
    });
    console.log("✓ Gerente");

    // Crear rol Cajero
    const cajeroModules = allModules.filter(m => {
      const module = allModules.find(mod => mod._id.equals(m._id));
      const page = allPages.find(p => p._id.equals(module.page));
      return page && (
        page.path === '/sucursal/nuevo-pedido' ||
        page.path === '/sucursal/ventas' ||
        page.path === '/ventas/cajas' ||
        page.path === '/panel/clientes' ||
        page.path === '/catalogos/productos' ||
        page.path === '/catalogos/payment-method'
      );
    });

    const cajeroRole = await Role.create({
      name: "Cajero",
      description: "Rol para cajeros",
      modules: cajeroModules.map(m => m._id),
      estatus: true,
    });
    console.log("✓ Cajero");

    // Crear rol Usuario básico
    const userModules = allModules.filter(m => {
      const moduleName = m.name.toLowerCase();
      return moduleName.includes('ver');
    }).slice(0, 5); // Solo algunos módulos de visualización

    const userRole = await Role.create({
      name: "Usuario",
      description: "Rol básico para usuarios regulares",
      modules: userModules.map(m => m._id),
      estatus: true,
    });
    console.log("✓ Usuario\n");

    // Crear usuarios
    console.log("👥 Creando usuarios...");
    const users = [
      {
        username: "admin",
        email: "admin@floriSoft.com",
        phone: "555-0001",
        password: "123qwe", // CONTRASEÑA: 123qwe
        profile: {
          name: "Administrador",
          lastName: "Sistema",
          fullName: "Administrador del Sistema",
          path: "/admin/profile",
          estatus: true,
        },
        role: superAdminRole._id,
      },
      {
        username: "juan.perez",
        email: "juan.perez@floriSoft.com",
        phone: "555-0002",
        password: "User123!",
        profile: {
          name: "Juan",
          lastName: "Pérez",
          fullName: "Juan Pérez",
          path: "/users/juan/profile",
          estatus: true,
        },
        role: userRole._id,
      },
      {
        username: "maria.garcia",
        email: "maria.garcia@floriSoft.com",
        phone: "555-0003",
        password: "User123!",
        profile: {
          name: "María",
          lastName: "García",
          fullName: "María García",
          path: "/users/maria/profile",
          estatus: true,
        },
        role: userRole._id,
      },
      {
        username: "carlos.lopez",
        email: "carlos.lopez@floriSoft.com",
        phone: "555-0004",
        password: "User123!",
        profile: {
          name: "Carlos",
          lastName: "López",
          fullName: "Carlos López",
          path: "/users/carlos/profile",
          estatus: true,
        },
        role: managerRole._id, // Asignando rol de gerente
      },
      {
        username: "ana.martinez",
        email: "ana.martinez@floriSoft.com",
        phone: "555-0005",
        password: "User123!",
        profile: {
          name: "Ana",
          lastName: "Martínez",
          fullName: "Ana Martínez",
          path: "/users/ana/profile",
          estatus: true,
        },
        role: cajeroRole._id, // Asignando rol de cajero
      },
    ];

    for (const userData of users) {
      const user = await User.create(userData);
      console.log(`✓ ${user.username} - ${user.profile.fullName}`);
    }

    // Crear clientes
    console.log("\n🧑 Creando clientes...");
    const clientsData = [
      {
        name: "Roberto",
        lastName: "Fernández García",
        phoneNumber: "555-1001",
        points: 150,
        status: true,
      },
      {
        name: "Isabella",
        lastName: "Morales Ruiz",
        phoneNumber: "555-1002",
        points: 320,
        status: true,
      },
      {
        name: "Diego",
        lastName: "Vargas Mendoza",
        phoneNumber: "555-1003",
        points: 85,
        status: true,
      },
      {
        name: "Valentina",
        lastName: "Restrepo Silva",
        phoneNumber: "555-1004",
        points: 500,
        status: false,
      },
      {
        name: "Sebastián",
        lastName: "Herrera Castillo",
        phoneNumber: "555-1005",
        points: 275,
        status: true,
      },
    ];

    for (const clientData of clientsData) {
      const client = await Client.create(clientData);
      console.log(
        `✓ ${client.name} ${client.lastName} - ${client.points} puntos`
      );
    }

    console.log("\n" + "═".repeat(60));
    console.log("🎉 SEED COMPLETADO EN BASE DE DATOS DE PRODUCCIÓN 🎉");
    console.log("═".repeat(60));
    console.log("\n📊 RESUMEN:");
    console.log(`  • Base de datos: produccion`);
    console.log(`  • ${allPages.length} Páginas creadas`);
    console.log(`  • ${allModules.length} Módulos (4 CRUD por página)`);
    console.log(`  • 6 Roles configurados`);
    console.log(`  • 5 Usuarios creados`);
    console.log(`  • 5 Clientes de prueba`);
    
    console.log("\n🔐 CREDENCIALES DE SUPER ADMIN:");
    console.log("  ┌─────────────────────────────────┐");
    console.log("  │  Usuario: admin                 │");
    console.log("  │  Contraseña: 123qwe             │");
    console.log("  │  Email: admin@floriSoft.com     │");
    console.log("  │  Rol: Super Admin               │");
    console.log("  └─────────────────────────────────┘");
    console.log("\n" + "═".repeat(60) + "\n");
    
  } catch (error) {
    console.error("\n❌ Error creando seed data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB PRODUCCIÓN");
  }
};

const runSeed = async () => {
  await connectDB();
  await createSeedData();
  process.exit(0);
};

// Ejecutar directamente
runSeed();