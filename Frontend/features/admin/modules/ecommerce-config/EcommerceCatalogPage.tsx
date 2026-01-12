"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Button,
  Badge,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  TbSearch,
  TbGridDots,
  TbList,
  TbShoppingCart,
  TbPackage,
  TbCloudUpload,
} from "react-icons/tb";
import { productListsService } from "@/features/admin/modules/product-lists/services/productLists";
import { storageService } from "@/features/admin/modules/storage/services/storage";
import { productCategoriesService } from "@/features/admin/modules/productCategories/services/productCategories";
import { ecommerceConfigService } from "./services/ecommerceConfig";
import { toast } from "react-toastify";
import ProductCard from "./components/ProductCard";
import CategoryFilter from "./components/CategoryFilter";
import PriceRangeFilter from "./components/PriceRangeFilter";
import CartModal from "./components/CartModal";
import { useCartStore } from "./store/cartStore";
import type { Product } from "@/features/admin/modules/products/types";
import type { ProductCategory } from "@/features/admin/modules/productCategories/types";
import type { Storage } from "@/features/admin/modules/storage/types";

interface ProductWithStock extends Product {
  stock: number;
  originalPrice?: number;
  discountPercentage?: number;
}

export default function EcommerceCatalogPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithStock[]>(
    []
  );
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState<
    "name" | "price-asc" | "price-desc" | "stock"
  >("name");
  const [branchId, setBranchId] = useState<string>("");
  const [hasNoStorage, setHasNoStorage] = useState(false);
  const [productCounts, setProductCounts] = useState<Record<string, number>>(
    {}
  );
  const [syncingToEcommerce, setSyncingToEcommerce] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);

  const { openCart, getTotalItems, initializeStock } = useCartStore();
  const totalItemsInCart = getTotalItems();

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Obtener la configuración del gerente para obtener el branchId
      const configResponse = await ecommerceConfigService.getManagerConfig();
      const branch = configResponse.data.branch;
      const config = configResponse.data.config;

      if (!branch?._id) {
        toast.error("No se pudo obtener la información de la sucursal");
        return;
      }

      setBranchId(branch._id);
      if (config?._id) {
        setConfigId(config._id);
      }

      // Cargar productos, storage y categorías en paralelo
      const [productListResponse, storageResponse, categoriesResponse] =
        await Promise.all([
          productListsService.getProductListByBranch(branch._id),
          storageService.getStorageByBranch(branch._id),
          productCategoriesService.getAllProductCategories({
            limit: 100,
            isActive: true,
          }),
        ]);

      // Procesar productos con stock
      if (productListResponse.success && productListResponse.data) {
        console.log("ProductList Response:", productListResponse.data);
        const productList = productListResponse.data.products || [];
        const storage: Storage | null = storageResponse.success
          ? storageResponse.data
          : null;

        if (!storage) {
          setHasNoStorage(true);
          setProducts([]);
          setFilteredProducts([]);
        } else {
          console.log("Storage products:", storage.products);
          // Combinar productos con stock del storage
          const productsWithStock = productList
            .map((product: any) => {
              // Los productos vienen embebidos con productId, nombre, totalVenta, etc.
              const productId = product.productId || product._id;
              const stockItem = storage.products?.find((p: any) => {
                const storageProductId =
                  typeof p.productId === "string"
                    ? p.productId
                    : p.productId?._id;
                return storageProductId === productId;
              });

              console.log(`Product ${product.nombre}:`, {
                productId,
                stockFound: !!stockItem,
                quantity: stockItem?.quantity,
              });

              return {
                _id: productId, // Usar productId como _id
                nombre: product.nombre,
                descripcion: product.descripcion,
                precio: product.totalVenta || product.precio || 0, // totalVenta es el precio
                stock: stockItem?.quantity || 0,
                productCategory: product.productCategory,
                imagen: product.imagen,
              };
            })
            .filter((p: ProductWithStock) => p.stock > 0); // Filtrar productos sin stock

          console.log("Products with stock:", productsWithStock);

          // Calcular precio máximo
          const max = Math.max(
            ...productsWithStock.map((p) => p.precio || 0),
            10000
          );
          setMaxPrice(max);
          setPriceRange([0, max]);

          // Calcular conteo de productos por categoría
          const counts: Record<string, number> = {};
          productsWithStock.forEach((product) => {
            const categoryId =
              typeof product.productCategory === "string"
                ? product.productCategory
                : product.productCategory?._id;
            if (categoryId) {
              counts[categoryId] = (counts[categoryId] || 0) + 1;
            }
          });
          setProductCounts(counts);
          console.log("Product counts by category:", counts);

          setProducts(productsWithStock);
          setFilteredProducts(productsWithStock);
          
          // Inicializar el stock disponible en el store
          initializeStock(productsWithStock.map(p => ({ _id: p._id, stock: p.stock })));
        }
      }

      // Establecer categorías
      if (categoriesResponse.success) {
        console.log("Categories Response:", categoriesResponse.data);
        setCategories(categoriesResponse.data);
      }
    } catch (error: any) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar el catálogo de productos");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar y ordenar productos
  useEffect(() => {
    let filtered = [...products];

    // Filtrar por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(search) ||
          p.descripcion?.toLowerCase().includes(search)
      );
    }

    // Filtrar por categorías
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(
        (p) =>
          p.productCategory &&
          selectedCategories.includes(
            p.productCategory._id || p.productCategory
          )
      );
    }

    // Filtrar por rango de precio
    filtered = filtered.filter((p) => {
      const price = p.precio || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Ordenar
    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
        break;
      case "price-asc":
        filtered.sort((a, b) => (a.precio || 0) - (b.precio || 0));
        break;
      case "price-desc":
        filtered.sort((a, b) => (b.precio || 0) - (a.precio || 0));
        break;
      case "stock":
        filtered.sort((a, b) => b.stock - a.stock);
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategories, priceRange, sortBy]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    setPriceRange(range);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, maxPrice]);
    setSearchTerm("");
    setSortBy("name");
  };

  // Sincronizar productos con la configuración del e-commerce
  const syncProductsToEcommerce = async () => {
    if (!configId) {
      toast.error("No se ha configurado el e-commerce para esta sucursal");
      return;
    }

    try {
      setSyncingToEcommerce(true);

      // Obtener la configuración actual para sumar al stock existente
      const configResponse = await ecommerceConfigService.getManagerConfig();
      const currentItemsStock = configResponse.data.config?.itemsStock || [];
      
      // Crear mapa de items existentes
      const existingItemsMap = new Map(
        currentItemsStock.map((item: any) => [item.productId || item._id, item])
      );

      // Preparar los productos para sincronizar
      const itemsStock = products.map(product => {
        const existingItem = existingItemsMap.get(product._id);
        
        return {
          _id: product._id,
          productId: product._id,
          nombre: product.nombre,
          descripcion: product.descripcion,
          precio: product.precio,
          // Si ya existe, sumar el stock del storage al existente
          stock: existingItem ? (existingItem.stock + product.stock) : product.stock,
          imagen: product.imagen,
          productCategory: typeof product.productCategory === 'string' 
            ? product.productCategory 
            : product.productCategory?._id,
          originalPrice: product.originalPrice,
          discountPercentage: product.discountPercentage
        };
      });

      // Mantener productos que ya estaban pero no están en el storage actual
      currentItemsStock.forEach((existingItem: any) => {
        const productId = existingItem.productId || existingItem._id;
        if (!products.find(p => p._id === productId)) {
          itemsStock.push(existingItem);
        }
      });

      // Actualizar la configuración y vaciar el storage
      await ecommerceConfigService.updateItemsStock(configId, itemsStock, true, true); // deductFromStorage=true, transferAll=true
      
      toast.success(`Stock transferido completamente al e-commerce. Storage vaciado.`);
      
      // Recargar los datos para reflejar el storage vacío
      await loadInitialData();
    } catch (error) {
      console.error("Error al sincronizar productos:", error);
      toast.error("Error al sincronizar productos con el e-commerce");
    } finally {
      setSyncingToEcommerce(false);
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (hasNoStorage) {
    return (
      <Alert variant="warning" className="m-4">
        <TbPackage size={24} className="me-2" />
        <strong>No hay almacén configurado</strong>
        <p className="mb-0 mt-2">
          Esta sucursal no tiene un almacén configurado. Por favor, configure un
          almacén para ver los productos disponibles.
        </p>
      </Alert>
    );
  }

  return (
    <div className="ecommerce-catalog-page">
      {/* Cart Modal */}
      <CartModal branchId={branchId} onProductsSaved={loadInitialData} />

      {/* Header */}
      <div className="bg-white border-bottom px-4 py-3 mb-4">
        <Row className="align-items-center g-3">
          <Col xs={12} md={2} lg={2}>
            <h6 className="mb-0 text-muted">
              {filteredProducts.length} Productos
            </h6>
          </Col>
          <Col xs={12} md={4} lg={4}>
            <div className="position-relative">
              <TbSearch
                className="position-absolute top-50 translate-middle-y ms-3 text-muted"
                size={20}
              />
              <Form.Control
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-5"
                size="sm"
              />
            </div>
          </Col>
          <Col xs={12} md={6} lg={6} className="text-md-end">
            <div className="d-flex align-items-center justify-content-end gap-2 flex-wrap">
              <Form.Select
                size="sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{ width: "auto", maxWidth: "180px" }}
              >
                <option value="name">Nombre</option>
                <option value="price-asc">Precio ↑</option>
                <option value="price-desc">Precio ↓</option>
                <option value="stock">Stock</option>
              </Form.Select>

              {/* View Mode Buttons */}
              <div className="btn-group" role="group">
                <Button
                  variant={
                    viewMode === "grid" ? "primary" : "outline-secondary"
                  }
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <TbGridDots size={18} />
                </Button>
                <Button
                  variant={
                    viewMode === "list" ? "primary" : "outline-secondary"
                  }
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <TbList size={18} />
                </Button>
              </div>

              {/* Sync to Ecommerce Button */}
              <Button
                variant="success"
                size="sm"
                onClick={syncProductsToEcommerce}
                disabled={syncingToEcommerce || products.length === 0}
                className="d-flex align-items-center gap-1"
                title="Transfiere TODO el stock del almacén al e-commerce"
              >
                {syncingToEcommerce ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <TbCloudUpload size={18} />
                )}
                <span className="d-none d-sm-inline">
                  {syncingToEcommerce ? "Transfiriendo..." : "Transferir Todo"}
                </span>
              </Button>

              {/* Cart Button */}
              <Button
                variant="warning"
                size="sm"
                onClick={openCart}
                className="position-relative"
              >
                <TbShoppingCart size={18} />
                {totalItemsInCart > 0 && (
                  <Badge
                    bg="danger"
                    pill
                    className="position-absolute"
                    style={{
                      top: "-8px",
                      right: "-8px",
                      fontSize: "0.65rem",
                    }}
                  >
                    {totalItemsInCart}
                  </Badge>
                )}
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <Row className="g-4 px-3">
        {/* Sidebar Filters */}
        <Col lg={3}>
          <Card className="border-0 shadow-sm mb-3">
            <Card.Header className="bg-light border-0">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Filtros</h6>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 text-decoration-none"
                  onClick={clearFilters}
                >
                  Limpiar
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {/* Categorías */}
              <CategoryFilter
                categories={categories}
                selectedCategories={selectedCategories}
                onCategoryToggle={handleCategoryToggle}
                productCounts={productCounts}
              />

              {/* Rango de Precio */}
              <PriceRangeFilter
                min={0}
                max={maxPrice}
                value={priceRange}
                onChange={handlePriceRangeChange}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Products Grid/List */}
        <Col lg={9}>
          {filteredProducts.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center py-5">
                <TbPackage size={64} className="text-muted mb-3" />
                <h5>No se encontraron productos</h5>
                <p className="text-muted">
                  Intenta ajustar los filtros o términos de búsqueda
                </p>
              </Card.Body>
            </Card>
          ) : (
            <Row className={viewMode === "grid" ? "g-3" : "g-2"}>
              {filteredProducts.map((product) => (
                <Col
                  key={product._id}
                  xs={12}
                  sm={viewMode === "grid" ? 6 : 12}
                  md={viewMode === "grid" ? 4 : 12}
                  lg={viewMode === "grid" ? 3 : 12}
                >
                  <ProductCard product={product} viewMode={viewMode} />
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>
    </div>
  );
}
