import mongoose from "mongoose";
import { Role } from "./src/models/Roles.js";
import { Module } from "./src/models/Module.js";
import { Page } from "./src/models/Page.js";
import { User } from "./src/models/User.js";
import dotenv from "dotenv";

dotenv.config();

// ─── 46 Páginas exactas de producción ────────────────────────────────────────
// modules: array con los 4 nombres de módulo que usa cada página
const STANDARD = ["ver", "crear", "editar", "eliminar"];
const WITH_ACTUALIZAR = ["ver", "crear", "actualizar", "eliminar"];

const pagesData = [
  // Gestión
  { name: "Empresas", path: "/gestion/empresas", modules: STANDARD },
  { name: "Dashboard Empresa", path: "/gestion/dashboard-empresa", modules: STANDARD },
  { name: "Dashboard Distribuidor", path: "/gestion/empresas/dashboard", modules: STANDARD },
  { name: "Proveedores", path: "/gestion/proveedores", modules: STANDARD },
  { name: "Roles", path: "/gestion/roles", modules: STANDARD },
  { name: "Páginas", path: "/gestion/paginas", modules: STANDARD },
  { name: "Usuarios", path: "/gestion/usuarios", modules: STANDARD },

  // Sucursal
  { name: "Sucursales", path: "/panel-de-control/sucursales", modules: STANDARD },
  { name: "Nuevo Pedido", path: "/sucursal/nuevo-pedido", modules: STANDARD },
  { name: "Ventas", path: "/sucursal/ventas", modules: STANDARD },
  { name: "Reparto", path: "/sucursal/reparto", modules: STANDARD },
  { name: "Almacenes", path: "/sucursal/almacenes", modules: STANDARD },
  { name: "Eventos", path: "/sucursal/eventos", modules: STANDARD },

  // Cajas
  { name: "Cajas Registradoras", path: "/ventas/cajas", modules: STANDARD },
  { name: "Cajas de Redes", path: "/ventas/cajas-redes-sociales", modules: STANDARD },
  { name: "Historial de Cajas", path: "/panel-de-control/cajas/historial", modules: STANDARD },

  // Producción
  { name: "Pizarrón de Producción", path: "/produccion/pizarron-ventas", modules: STANDARD },
  { name: "Pizarrón de Envío", path: "/produccion/pizarron-envio", modules: STANDARD },
  { name: "Listado de Producción", path: "/ventas/listado-produccion", modules: STANDARD },
  { name: "Ventas de Franquicias", path: "/ventas/ventas-empresas", modules: STANDARD },

  // Panel de usuarios
  { name: "Clientes", path: "/panel/clientes", modules: STANDARD },
  { name: "Cajeros", path: "/panel/cajeros", modules: STANDARD },
  { name: "Personal de Producción", path: "/panel/produccion", modules: STANDARD },
  { name: "Repartidores", path: "/panel/repartidores", modules: STANDARD },
  { name: "Gerentes", path: "/panel/gerentes", modules: STANDARD },

  // Puntos y Tarjetas
  { name: "Tarjetas Digitales", path: "/admin/digital-cards", modules: STANDARD },
  { name: "Configuración de Puntos", path: "/panel/config-puntos", modules: STANDARD },

  // Catálogos
  { name: "Canales de venta", path: "/catalogos/canales-venta", modules: WITH_ACTUALIZAR },
  { name: "Etapas de Ventas", path: "/catalogos/etapas", modules: STANDARD },
  { name: "Productos", path: "/catalogos/productos", modules: STANDARD },
  { name: "Categorías de Productos", path: "/catalogos/categorias-productos", modules: STANDARD },
  { name: "Listas de Productos", path: "/catalogos/listas-productos", modules: STANDARD },
  { name: "Materiales", path: "/catalogos/materiales", modules: STANDARD },
  { name: "Gestión de Materiales", path: "/catalogos/gestion-materiales", modules: STANDARD },
  { name: "Unidades de Medida", path: "/catalogos/unidades-medida", modules: STANDARD },
  { name: "Métodos de Pago", path: "/catalogos/payment-method", modules: STANDARD },
  { name: "Conceptos de Gastos", path: "/catalogos/conceptos-gastos", modules: STANDARD },
  { name: "Gastos", path: "/catalogos/gastos", modules: STANDARD },
  { name: "Compras", path: "/catalogos/compras", modules: STANDARD },
  { name: "Colonias", path: "/catalogos/colonias", modules: STANDARD },

  // Reportes
  { name: "Finanzas", path: "/finanzas/finanzas", modules: STANDARD },

  // E-commerce
  { name: "diseno de ecommerce", path: "/ecommerce/configuracion/diseno", modules: WITH_ACTUALIZAR },
  { name: "catalogo de productos de ecommerce", path: "/ecommerce/catalogo", modules: WITH_ACTUALIZAR },
  { name: "ecommerce dashboard page", path: "/ecommerce/dashboard", modules: WITH_ACTUALIZAR },

  // Usuarios especiales
  { name: "usuarios de produccion", path: "/panel/produccion-usuarios", modules: WITH_ACTUALIZAR },
  { name: "usuarios de redes", path: "/panel/usuarios-redes", modules: WITH_ACTUALIZAR },
];

// ─── 9 Roles con sus páginas exactas ─────────────────────────────────────────
// Cada rol define las rutas (paths) de las páginas a las que tiene acceso
// y qué módulos recibe ("all" = los 4 módulos, o un array específico)
const rolesData = [
  {
    name: "Super Admin",
    description: "Rol con permisos totales del sistema",
    // Todas las páginas, todos los módulos
    pages: "ALL",
  },
  {
    name: "Administrador",
    description: "Rol con permisos administrativos",
    pages: [
      "/gestion/empresas/dashboard",
      "/gestion/dashboard-empresa",
      "/gestion/empresas",
      "/finanzas/finanzas",
      "/panel-de-control/cajas/historial",
      "/gestion/paginas",
      "/gestion/proveedores",
      "/gestion/roles",
      "/panel-de-control/sucursales",
      "/admin/digital-cards",
      "/gestion/usuarios",
    ],
  },
  {
    name: "Distribuidor",
    description: "Rol para distribuidores del sistema",
    pages: [
      "/panel/clientes",
      "/catalogos/colonias",
      "/gestion/empresas/dashboard",
      "/gestion/dashboard-empresa",
      "/gestion/empresas",
      "/produccion/pizarron-envio",
      "/panel/repartidores",
      "/sucursal/reparto",
    ],
  },
  {
    name: "Gerente",
    description: "Rol para gerentes de sucursales",
    pages: [
      "/sucursal/almacenes",
      "/ventas/cajas-redes-sociales",
      "/ventas/cajas",
      "/panel/cajeros",
      "/catalogos/canales-venta",
      "/ecommerce/catalogo",
      "/catalogos/categorias-productos",
      "/panel/clientes",
      "/catalogos/colonias",
      "/catalogos/compras",
      "/catalogos/conceptos-gastos",
      "/panel/config-puntos",
      "/ecommerce/configuracion/diseno",
      "/catalogos/etapas",
      "/sucursal/eventos",
      "/finanzas/finanzas",
      "/catalogos/gastos",
      "/panel/gerentes",
      "/catalogos/gestion-materiales",
      "/ventas/listado-produccion",
      "/catalogos/listas-productos",
      "/catalogos/materiales",
      "/catalogos/payment-method",
      "/sucursal/nuevo-pedido",
      "/panel/produccion",
      "/produccion/pizarron-envio",
      "/produccion/pizarron-ventas",
      "/catalogos/productos",
      "/panel/repartidores",
      "/sucursal/reparto",
      "/admin/digital-cards",
      "/catalogos/unidades-medida",
      "/panel/produccion-usuarios",
      "/panel/usuarios-redes",
      "/sucursal/ventas",
    ],
  },
  {
    name: "Cajero",
    description: "Rol para cajeros",
    pages: [
      "/ventas/cajas",
      "/panel/clientes",
      "/ecommerce/dashboard",
      "/panel-de-control/cajas/historial",
      "/sucursal/nuevo-pedido",
      "/sucursal/ventas",
    ],
  },
  {
    name: "Usuario",
    description: "Rol básico para usuarios regulares",
    // Solo módulo "ver"
    onlyModules: ["ver"],
    pages: [
      "/gestion/empresas/dashboard",
      "/gestion/dashboard-empresa",
      "/gestion/empresas",
      "/gestion/proveedores",
      "/gestion/roles",
    ],
  },
  {
    name: "Redes",
    description: "Rol para personal de redes sociales",
    pages: [
      "/gestion/dashboard-empresa",
      "/panel-de-control/sucursales",
      "/sucursal/nuevo-pedido",
      "/sucursal/ventas",
      "/ventas/listado-produccion",
      "/produccion/pizarron-ventas",
      "/produccion/pizarron-envio",
      "/panel-de-control/cajas/historial",
      "/ventas/cajas-redes-sociales",
    ],
  },
  {
    name: "Repartidor",
    description: "Rol para repartidores",
    pages: [
      "/ventas/listado-produccion",
      "/produccion/pizarron-envio",
      "/sucursal/reparto",
      "/sucursal/ventas",
    ],
  },
  {
    name: "Produccion",
    description: "Rol para personal de producción",
    pages: [
      "/ventas/listado-produccion",
      "/produccion/pizarron-ventas",
      "/panel/produccion-usuarios",
      "/sucursal/ventas",
    ],
  },
  {
    name: "demo",
    description: "Rol de demostración con acceso de solo lectura",
    onlyModules: ["ver"],
    pages: [
      "/sucursal/ventas",
      "/produccion/pizarron-ventas",
      "/ventas/listado-produccion",
      "/finanzas/finanzas",
      "/panel/config-puntos",
      "/catalogos/etapas",
      "/catalogos/listas-productos",
      "/gestion/roles",
      "/ecommerce/configuracion/diseno",
    ],
  },
];

// ─── Funciones principales ───────────────────────────────────────────────────

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB conectado:", mongoose.connection.host);
  } catch (error) {
    console.error("Error de conexión:", error.message);
    process.exit(1);
  }
};

const seedRoles = async () => {
  try {
    console.log("\n🌱 Iniciando seed de roles, páginas y módulos...\n");

    // ── Paso 1: Crear páginas y módulos ──
    // Map: path → { page, modules: Map<moduleName, moduleId> }
    const pageMap = new Map();
    const allModuleIds = [];
    let pageCount = 0;
    let moduleCount = 0;

    for (const pd of pagesData) {
      const page = await Page.create({
        name: pd.name,
        path: pd.path,
        description: `Página de ${pd.name}`,
        status: true,
      });

      const modulesMap = new Map();
      const pageModuleIds = [];

      for (const modName of pd.modules) {
        const mod = await Module.create({
          name: modName,
          description: `Permite ${modName} en ${pd.name}`,
          page: page._id,
          status: true,
        });
        modulesMap.set(modName, mod._id);
        pageModuleIds.push(mod._id);
        allModuleIds.push(mod._id);
        moduleCount++;
      }

      page.modules = pageModuleIds;
      await page.save();

      pageMap.set(pd.path, { page, modules: modulesMap });
      pageCount++;
      console.log(`  ✓ ${pd.name} (${pd.path}) — ${pd.modules.join(", ")}`);
    }

    console.log(`\n📄 ${pageCount} páginas creadas con ${moduleCount} módulos\n`);

    // ── Paso 2: Crear roles ──
    console.log("👥 Creando roles...\n");

    for (const rd of rolesData) {
      let roleModuleIds = [];

      if (rd.pages === "ALL") {
        // Super Admin: todos los módulos
        roleModuleIds = [...allModuleIds];
      } else {
        for (const path of rd.pages) {
          const entry = pageMap.get(path);
          if (!entry) {
            console.warn(`  ⚠️  Página no encontrada para path: ${path}`);
            continue;
          }

          if (rd.onlyModules) {
            // Solo módulos específicos (ej. "Usuario" solo tiene "ver")
            for (const modName of rd.onlyModules) {
              const modId = entry.modules.get(modName);
              if (modId) roleModuleIds.push(modId);
            }
          } else {
            // Todos los módulos de la página
            for (const modId of entry.modules.values()) {
              roleModuleIds.push(modId);
            }
          }
        }
      }

      await Role.create({
        name: rd.name,
        description: rd.description,
        modules: roleModuleIds,
        estatus: true,
      });

      console.log(`  ✓ ${rd.name} — ${roleModuleIds.length} módulos`);
    }

    // ── Paso 3: Crear usuario Super Admin ──
    const superAdminRole = await Role.findOne({ name: "Super Admin" });
    const adminUser = await User.create({
      username: "admin",
      email: "admin@floriSoft.com",
      phone: "555-0001",
      password: "123qwe",
      profile: {
        name: "Administrador",
        lastName: "Sistema",
        fullName: "Administrador del Sistema",
        path: "/admin/profile",
        estatus: true,
      },
      role: superAdminRole._id,
    });
    console.log(`\n👤 Usuario Super Admin creado: ${adminUser.username}`);

    // ── Resumen ──
    console.log("\n" + "═".repeat(60));
    console.log("🎉 SEED COMPLETADO");
    console.log("═".repeat(60));
    console.log(`\n📊 RESUMEN:`);
    console.log(`  • ${pageCount} páginas`);
    console.log(`  • ${moduleCount} módulos`);
    console.log(`  • ${rolesData.length} roles:`);
    for (const rd of rolesData) {
      const count = rd.pages === "ALL"
        ? allModuleIds.length
        : rd.onlyModules
          ? rd.pages.length * rd.onlyModules.length
          : rd.pages.length * 4;
      console.log(`    - ${rd.name} (${count} módulos)`);
    }
    console.log("═".repeat(60) + "\n");
  } catch (error) {
    console.error("❌ Error en el seed:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB desconectado");
  }
};

const run = async () => {
  await connectDB();
  await seedRoles();
  process.exit(0);
};

run();
