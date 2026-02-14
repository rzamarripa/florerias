import { PageModules } from "@/types/auth";
import { MenuItemType } from "@/types/menu";
import { 
  MENU_METADATA, 
  CATEGORY_ORDER, 
  getMenuMetadata,
  MenuMetadata 
} from "@/config/menuMapping";
import { 
  Package2, 
  Building2, 
  Users, 
  FileText, 
  Wallet, 
  Package,
  Settings,
  Box,
  LayoutDashboard,
  Store,
  Factory,
  TrendingUp,
  Heart,
  UserCircle,
  ShoppingBag,
  ClipboardList,
  CreditCard,
  Wrench
} from "lucide-react";

interface MenuCategory {
  name: string;
  icon?: any;
  items: MenuItemType[];
  subCategories?: Record<string, MenuItemType[]>;
}

// Iconos para las categorías principales
const CATEGORY_ICONS: Record<string, any> = {
  "Dashboard / Inicio": LayoutDashboard,
  "Operaciones": Store,
  "Producción": Factory,
  "Finanzas y Reportes": TrendingUp,
  "Clientes y Lealtad": Heart,
  "Personal": UserCircle,
  "Sucursales y Empresas": Building2,
  "Catálogos": ClipboardList,
  "Gestión del Sistema": Settings,
  "E-commerce": ShoppingBag,
  // Subcategorías
  "Cajas": CreditCard,
  "Productos": Package,
  "Configuración": Wrench,
  "Inventario": Box // Legacy support
};

/**
 * Construye el menú completo basándose en los permisos del usuario
 * @param allowedModules - Módulos/páginas permitidas del usuario desde el store
 * @param isSuperAdmin - Si el usuario es Super Admin (acceso total)
 */
export const buildMenuFromPermissions = (
  allowedModules: PageModules[],
  isSuperAdmin: boolean = false
): MenuItemType[] => {
  // Si es Super Admin, construir menú completo desde MENU_METADATA
  if (isSuperAdmin) {
    return buildCompleteMenu();
  }

  // Para otros usuarios, construir basándose en allowedModules
  return buildRestrictedMenu(allowedModules);
};

/**
 * Construye el menú completo para Super Admin
 */
const buildCompleteMenu = (): MenuItemType[] => {
  const menuItems: MenuItemType[] = [];
  const categoriesMap: Record<string, MenuCategory> = {};

  // Agregar título principal del menú
  menuItems.push({
    key: "menu-title",
    label: "Menú",
    isTitle: true
  });

  // Agrupar items por categoría y subcategoría
  Object.entries(MENU_METADATA).forEach(([path, metadata]) => {
    const category = metadata.category || "General";
    
    if (!categoriesMap[category]) {
      categoriesMap[category] = {
        name: category,
        icon: CATEGORY_ICONS[category],
        items: [],
        subCategories: {}
      };
    }

    const menuItem = createMenuItem(path, metadata, []);
    
    // Si tiene subcategoría, agregarlo ahí
    if (metadata.subcategory) {
      if (!categoriesMap[category].subCategories![metadata.subcategory]) {
        categoriesMap[category].subCategories![metadata.subcategory] = [];
      }
      categoriesMap[category].subCategories![metadata.subcategory].push(menuItem);
    } else {
      // Si no tiene subcategoría, es un item directo de la categoría
      categoriesMap[category].items.push(menuItem);
    }
  });

  // Construir la estructura final del menú con dropdowns
  CATEGORY_ORDER.forEach((categoryName) => {
    const category = categoriesMap[categoryName];
    if (!category) return;
    
    // Si no hay items ni subcategorías, saltar
    if (category.items.length === 0 && (!category.subCategories || Object.keys(category.subCategories).length === 0)) {
      return;
    }

    // Ordenar items directos por su orden definido
    const sortedItems = category.items.sort((a, b) => {
      const aOrder = MENU_METADATA[a.url!]?.order || 999;
      const bOrder = MENU_METADATA[b.url!]?.order || 999;
      return aOrder - bOrder;
    });

    // Procesar subcategorías y agregarlas como items con children
    const processedItems = [...sortedItems];
    
    if (category.subCategories) {
      Object.entries(category.subCategories).forEach(([subCatName, subItems]) => {
        if (subItems.length > 0) {
          // Ordenar items de la subcategoría
          const sortedSubItems = subItems.sort((a, b) => {
            const aOrder = MENU_METADATA[a.url!]?.order || 999;
            const bOrder = MENU_METADATA[b.url!]?.order || 999;
            return aOrder - bOrder;
          });

          // Crear item de subcategoría con children
          const subCategoryItem: MenuItemType = {
            key: `subcategory-${categoryName}-${subCatName}`.toLowerCase().replace(/\s+/g, '-'),
            label: subCatName,
            icon: CATEGORY_ICONS[subCatName] || Package2,
            children: sortedSubItems
          };

          // Insertar la subcategoría en la posición correcta
          // Cajas después de Eventos, Productos al inicio, Configuración al final
          if (subCatName === "Cajas") {
            processedItems.push(subCategoryItem); // Al final de Operaciones
          } else if (subCatName === "Productos") {
            processedItems.splice(1, 0, subCategoryItem); // Después de Etapas de Ventas
          } else if (subCatName === "Configuración") {
            processedItems.push(subCategoryItem); // Al final de Catálogos
          } else {
            processedItems.push(subCategoryItem);
          }
        }
      });
    }

    // Crear el elemento padre de la categoría con sus hijos
    const categoryItem: MenuItemType = {
      key: `category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`,
      label: categoryName,
      icon: category.icon,
      children: processedItems
    };

    menuItems.push(categoryItem);
  });

  return menuItems;
};

/**
 * Construye el menú restringido basándose en los permisos del usuario
 */
const buildRestrictedMenu = (allowedModules: PageModules[]): MenuItemType[] => {
  const menuItems: MenuItemType[] = [];
  const categoriesMap: Record<string, MenuCategory> = {};

  // Filtrar solo las páginas con permiso "ver"
  const viewablePages = allowedModules.filter(page => 
    page.modules.some(module => module.name.toLowerCase() === 'ver')
  );

  // Si no hay páginas visibles, retornar menú vacío
  if (viewablePages.length === 0) {
    return [];
  }

  // Agregar título principal del menú
  menuItems.push({
    key: "menu-title",
    label: "Menú",
    isTitle: true
  });

  // Construir items del menú para cada página permitida
  viewablePages.forEach(page => {
    const metadata = getMenuMetadata(page.path);
    if (!metadata) {
      // Si no hay metadata, crear item básico
      const category = "General";
      if (!categoriesMap[category]) {
        categoriesMap[category] = {
          name: category,
          icon: Package2,
          items: []
        };
      }

      categoriesMap[category].items.push({
        key: page.pageId || page.path,
        label: page.page || formatPathToLabel(page.path),
        url: page.path,
        icon: Package2,
        permissions: page.modules.map(m => m.name)
      });
    } else {
      // Usar metadata definida
      const category = metadata.category || "General";
      
      if (!categoriesMap[category]) {
        categoriesMap[category] = {
          name: category,
          icon: CATEGORY_ICONS[category],
          items: [],
          subCategories: {}
        };
      }

      const menuItem = createMenuItem(
        page.path, 
        metadata, 
        page.modules.map(m => m.name)
      );
      
      // Si tiene subcategoría, agregarlo ahí
      if (metadata.subcategory) {
        if (!categoriesMap[category].subCategories![metadata.subcategory]) {
          categoriesMap[category].subCategories![metadata.subcategory] = [];
        }
        categoriesMap[category].subCategories![metadata.subcategory].push(menuItem);
      } else {
        // Si no tiene subcategoría, es un item directo
        categoriesMap[category].items.push(menuItem);
      }
    }
  });

  // Construir la estructura final del menú con dropdowns
  CATEGORY_ORDER.forEach((categoryName) => {
    const category = categoriesMap[categoryName];
    if (!category) return;
    
    // Si no hay items ni subcategorías, saltar
    if (category.items.length === 0 && (!category.subCategories || Object.keys(category.subCategories).length === 0)) {
      return;
    }

    // Ordenar items directos
    const sortedItems = category.items.sort((a, b) => {
      const aOrder = a.url ? (MENU_METADATA[a.url]?.order || 999) : 999;
      const bOrder = b.url ? (MENU_METADATA[b.url]?.order || 999) : 999;
      return aOrder - bOrder;
    });

    // Procesar subcategorías
    const processedItems = [...sortedItems];
    
    if (category.subCategories) {
      Object.entries(category.subCategories).forEach(([subCatName, subItems]) => {
        if (subItems.length > 0) {
          // Ordenar items de la subcategoría
          const sortedSubItems = subItems.sort((a, b) => {
            const aOrder = a.url ? (MENU_METADATA[a.url]?.order || 999) : 999;
            const bOrder = b.url ? (MENU_METADATA[b.url]?.order || 999) : 999;
            return aOrder - bOrder;
          });

          // Crear item de subcategoría con children
          const subCategoryItem: MenuItemType = {
            key: `subcategory-${categoryName}-${subCatName}`.toLowerCase().replace(/\s+/g, '-'),
            label: subCatName,
            icon: CATEGORY_ICONS[subCatName] || Package2,
            children: sortedSubItems
          };

          // Insertar la subcategoría en la posición correcta
          if (subCatName === "Cajas") {
            processedItems.push(subCategoryItem); // Al final de Operaciones
          } else if (subCatName === "Productos") {
            processedItems.splice(1, 0, subCategoryItem); // Después de primer item
          } else if (subCatName === "Configuración") {
            processedItems.push(subCategoryItem); // Al final
          } else {
            processedItems.push(subCategoryItem);
          }
        }
      });
    }

    // Siempre mantener la estructura jerárquica, sin colapsar categorías
    if (processedItems.length > 0) {
      // Crear el elemento padre de la categoría con sus hijos
      const categoryItem: MenuItemType = {
        key: `category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`,
        label: categoryName,
        icon: category.icon,
        children: processedItems
      };

      menuItems.push(categoryItem);
    }
    // Si processedItems está vacío, la categoría no se muestra
  });

  return menuItems;
};

/**
 * Crea un item del menú con la estructura correcta
 */
const createMenuItem = (
  path: string, 
  metadata: MenuMetadata,
  permissions: string[] = []
): MenuItemType => {
  const key = path.replace(/\//g, '-').substring(1) || 'root';
  
  return {
    key,
    label: metadata.label,
    url: path,
    icon: metadata.icon,
    permissions
  };
};

/**
 * Convierte una ruta en una etiqueta legible
 */
const formatPathToLabel = (path: string): string => {
  const segments = path.split('/').filter(s => s.length > 0);
  if (segments.length === 0) return 'Inicio';
  
  const lastSegment = segments[segments.length - 1];
  return lastSegment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Obtiene la primera ruta disponible para el usuario (para redirección inicial)
 */
export const getFirstAvailableRoute = (
  allowedModules: PageModules[],
  isSuperAdmin: boolean = false
): string => {
  // Para Super Admin, usar ruta por defecto
  if (isSuperAdmin) {
    return '/gestion/roles';
  }

  // Buscar la primera página con permiso "ver"
  const viewablePages = allowedModules.filter(page => 
    page.modules.some(module => module.name.toLowerCase() === 'ver')
  );

  if (viewablePages.length === 0) {
    return '/'; // Página por defecto si no hay permisos
  }

  // Ordenar por categoría y orden para obtener la más relevante
  const sortedPages = viewablePages.sort((a, b) => {
    const aMetadata = getMenuMetadata(a.path);
    const bMetadata = getMenuMetadata(b.path);
    
    const aCategoryIndex = CATEGORY_ORDER.indexOf(aMetadata?.category || 'General');
    const bCategoryIndex = CATEGORY_ORDER.indexOf(bMetadata?.category || 'General');
    
    if (aCategoryIndex !== bCategoryIndex) {
      return aCategoryIndex - bCategoryIndex;
    }
    
    const aOrder = aMetadata?.order || 999;
    const bOrder = bMetadata?.order || 999;
    return aOrder - bOrder;
  });

  return sortedPages[0].path;
};