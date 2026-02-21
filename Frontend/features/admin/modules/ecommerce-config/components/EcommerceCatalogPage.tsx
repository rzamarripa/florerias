"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Package,
  Loader2,
  Grid3X3,
  List,
  Star,
  ArrowLeft,
  LogOut,
  User,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCartStore } from "../store/cartStore";
import { useClientSessionStore } from "@/stores/clientSessionStore";
import ClientCartModal from "./ClientCartModal";
import EcommerceCheckoutModal from "./EcommerceCheckoutModal";
import { ecommerceConfigService } from "../services/ecommerceConfig";
import type { StockItem, EcommerceConfig } from "../types";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { env } from "@/config/env";
import { getClientToken } from "../services/clientAuth";
import type { EcommerceConfigColors } from "../types";

export default function EcommerceCatalogPage() {
  const router = useRouter();
  const { client, isAuthenticated, logout, getClientFullName } =
    useClientSessionStore();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<EcommerceConfig | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<StockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "name" | "price-asc" | "price-desc" | "rating"
  >("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [productRatings, setProductRatings] = useState<Record<string, { avgRating: number; count: number }>>({});

  const DEFAULT_COLORS: EcommerceConfigColors = {
    primary: "#6366f1",
    secondary: "#10b981",
    background: "#ffffff",
    text: "#1f2937",
  };

  // Price filter state
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [sliderMax, setSliderMax] = useState(0);

  const {
    addToCart,
    getTotalItems,
    openCart,
    initializeStock,
    getAvailableStock,
  } = useCartStore();
  const totalItemsInCart = getTotalItems();

  // Load configuration and products
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await ecommerceConfigService.getManagerConfig();
      const { config: configData, branch } = response.data;

      if (branch?._id) {
        setBranchId(branch._id);
      }

      const fullConfig = {
        ...configData,
        header: configData?.header || {
          pageTitle: branch?.branchName || "Mi Tienda Online",
          logoUrl: "",
          logoPath: "",
          topbar: [],
        },
        colors: configData?.colors || {
          primary: "#6366f1",
          secondary: "#10b981",
          background: "#ffffff",
          text: "#1f2937",
        },
        typography: configData?.typography || {
          titleFont: "Inter",
          titleSize: 36,
          textFont: "Inter",
          subtitleSize: 24,
          normalSize: 16,
        },
      };

      setConfig(fullConfig);

      // Initialize stock
      if (fullConfig.itemsStock && fullConfig.itemsStock.length > 0) {
        initializeStock(
          fullConfig.itemsStock.map((p) => ({ _id: p._id, stock: p.stock || 0 }))
        );

        const prices = fullConfig.itemsStock.map((p) => p.precio);
        const calculatedMax = Math.ceil(Math.max(...prices));
        setSliderMax(calculatedMax);
        setPriceRange([0, calculatedMax]);

        // Load real review averages
        const productIds = fullConfig.itemsStock.map((p) => p._id).join(",");
        try {
          const ratingsRes = await fetch(
            `${env.NEXT_PUBLIC_API_URL}/reviews/products/averages?productIds=${productIds}`
          );
          const ratingsData = await ratingsRes.json();
          if (ratingsData.success && ratingsData.data) {
            const ratingsMap: Record<string, { avgRating: number; count: number }> = {};
            ratingsData.data.forEach((r: any) => {
              ratingsMap[r.productId] = { avgRating: r.avgRating, count: r.count };
            });
            setProductRatings(ratingsMap);
          }
        } catch (err) {
          console.error("Error al cargar ratings:", err);
        }
      }

      // Load categories from backend
      const clientToken = getClientToken();
      if (clientToken) {
        try {
          const catRes = await fetch(
            `${env.NEXT_PUBLIC_API_URL}/product-categories/by-company`,
            { headers: { Authorization: `Bearer ${clientToken}` } }
          );
          const catData = await catRes.json();
          if (catData.success && catData.data) {
            setCategories(catData.data.map((c: any) => ({ id: c._id, name: c.name })));
          }
        } catch (err) {
          console.error("Error al cargar categorías:", err);
        }
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error);
      toast.error("Error al cargar el catálogo");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort products
  useEffect(() => {
    if (!config?.itemsStock) return;

    let filtered = [...config.itemsStock];

    // Filter by search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(search) ||
          p.descripcion?.toLowerCase().includes(search)
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => {
        const catId =
          typeof p.productCategory === "object"
            ? p.productCategory?._id
            : p.productCategory;
        return catId === selectedCategory;
      });
    }

    // Filter by price range
    filtered = filtered.filter(
      (p) => p.precio >= priceRange[0] && p.precio <= priceRange[1]
    );

    // Sort
    switch (sortBy) {
      case "name":
        filtered.sort((a, b) =>
          (a.nombre || "").localeCompare(b.nombre || "")
        );
        break;
      case "price-asc":
        filtered.sort((a, b) => (a.precio || 0) - (b.precio || 0));
        break;
      case "price-desc":
        filtered.sort((a, b) => (b.precio || 0) - (a.precio || 0));
        break;
      case "rating":
        filtered.sort(
          (a, b) =>
            (productRatings[b._id]?.avgRating || 0) -
            (productRatings[a._id]?.avgRating || 0)
        );
        break;
    }

    setFilteredProducts(filtered);
  }, [config?.itemsStock, searchTerm, sortBy, priceRange, selectedCategory, productRatings]);

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values);
  };

  const handleAddToCart = (product: StockItem) => {
    if (product.stock <= 0) {
      toast.error("No hay stock disponible");
      return;
    }

    addToCart(
      {
        _id: product._id,
        nombre: product.nombre,
        descripcion: product.descripcion,
        precio: product.precio,
        stock: product.stock,
        imagen: product.imagen,
        productCategory: product.productCategory,
      },
      1
    );

    toast.success(`${product.nombre} agregado al carrito`);
  };

  const handleLogout = () => {
    logout();
    router.push("/ecommerce-preview");
  };

  // Helper: get category name for a product
  const getCategoryName = (product: StockItem): string => {
    if (typeof product.productCategory === "object" && product.productCategory?.name) {
      return product.productCategory.name;
    }
    const catId = typeof product.productCategory === "string" ? product.productCategory : "";
    const found = categories.find((c) => c.id === catId);
    return found?.name || "";
  };

  // Colors shorthand
  const colors = config?.colors || DEFAULT_COLORS;

  // Reusable filter content for desktop sidebar and mobile sheet
  const renderFilters = () => (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-foreground">
          Buscar
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Separator />

      {/* Categories */}
      {categories.length > 0 && (
        <>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Categorias
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                style={
                  selectedCategory === "all"
                    ? { backgroundColor: colors.primary, color: "#ffffff" }
                    : { backgroundColor: "#f1f5f9", color: "#64748b" }
                }
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  style={
                    selectedCategory === cat.id
                      ? { backgroundColor: colors.primary, color: "#ffffff" }
                      : { backgroundColor: "#f1f5f9", color: "#64748b" }
                  }
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Price Range */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Rango de precio
        </h3>
        <Slider
          value={priceRange}
          onValueChange={handlePriceRangeChange}
          min={0}
          max={sliderMax || 1}
          step={sliderMax < 500 ? 10 : sliderMax < 5000 ? 50 : 100}
          className="mb-3"
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-xl mb-4">No se pudo cargar el catálogo</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* ===== HEADER ===== */}
      <header
        className="sticky top-0 z-30 border-b border-border backdrop-blur-sm"
        style={{ backgroundColor: colors.primary }}
      >
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 lg:px-8">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/ecommerce-preview")}
              style={{ color: "#ffffff" }}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div className="hidden h-6 w-px sm:block" style={{ backgroundColor: "rgba(255,255,255,0.3)" }} />
            <h1 className="font-serif text-xl font-bold sm:text-2xl" style={{ color: "#ffffff" }}>
              Realizar Pedido
            </h1>
          </div>

          {/* Right: Sort + View + Cart + Client */}
          <div className="flex items-center gap-2">
            {/* Sort Select */}
            <div className="hidden items-center gap-1 md:flex">
              <Select
                value={sortBy}
                onValueChange={(v) =>
                  setSortBy(v as "name" | "price-asc" | "price-desc" | "rating")
                }
              >
                <SelectTrigger
                  className="h-8 w-40 text-xs"
                  style={{
                    color: "#ffffff",
                    backgroundColor: "rgba(255,255,255,0.15)",
                    borderColor: "rgba(255,255,255,0.3)",
                  }}
                >
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nombre</SelectItem>
                  <SelectItem value="price-asc">
                    Precio: menor a mayor
                  </SelectItem>
                  <SelectItem value="price-desc">
                    Precio: mayor a menor
                  </SelectItem>
                  <SelectItem value="rating">Mejor valorados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Toggle */}
            <div
              className="hidden items-center rounded-lg p-0.5 sm:flex"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              <button
                onClick={() => setViewMode("grid")}
                className="rounded-md p-1.5 transition-colors"
                style={{
                  backgroundColor: viewMode === "grid" ? "rgba(255,255,255,0.25)" : "transparent",
                  color: "#ffffff",
                }}
                aria-label="Vista de cuadricula"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className="rounded-md p-1.5 transition-colors"
                style={{
                  backgroundColor: viewMode === "list" ? "rgba(255,255,255,0.25)" : "transparent",
                  color: "#ffffff",
                }}
                aria-label="Vista de lista"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Cart Button */}
            <Button
              onClick={openCart}
              variant="ghost"
              size="sm"
              className="relative"
              style={{
                color: "#ffffff",
                backgroundColor: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Carrito</span>
              {totalItemsInCart > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px] font-bold"
                  style={{ backgroundColor: "#ffffff", color: colors.primary }}
                >
                  {totalItemsInCart}
                </Badge>
              )}
            </Button>

            {/* Client Dropdown */}
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                    style={{
                      color: "#ffffff",
                      backgroundColor: "rgba(255,255,255,0.15)",
                      border: "1px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    <User className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">
                      {getClientFullName()}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => router.push("/ecommerce-dashboard")}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Mis Pedidos
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <div className="mx-auto flex max-w-screen-2xl gap-8 px-4 py-6 lg:px-8">
        {/* Desktop Sidebar */}
        <aside className="sticky top-20 hidden h-fit w-64 shrink-0 lg:block">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">
              Filtros
            </h2>
            {renderFilters()}
          </div>
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {filteredProducts.length}
              </span>{" "}
              productos encontrados
            </p>
          </div>
        </aside>

        {/* Product Area */}
        <main className="flex-1">
          {/* Mobile filter trigger + product count */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} productos
            </p>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="font-serif">Filtros</SheetTitle>
                  <SheetDescription>
                    Filtra productos por categoría y precio
                  </SheetDescription>
                </SheetHeader>
                <div className="p-4">{renderFilters()}</div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Products */}
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-serif text-xl font-semibold text-foreground">
                No se encontraron productos
              </h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Intenta ajustar los filtros o buscar otro término
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product: any) => {
                const isOutOfStock = product.stock <= 0;
                const rating = productRatings[product._id]?.avgRating || 0;
                const reviewCount = productRatings[product._id]?.count || 0;
                const isLowStock =
                  product.stock > 0 && product.stock <= 5;
                const categoryName = getCategoryName(product);

                return (
                  <div
                    key={product._id}
                    className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg"
                  >
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {(product.imagen || product.imageUrl) ? (
                        <img
                          src={product.imageUrl || product.imagen}
                          alt={product.nombre}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/5" />

                      {/* Low Stock Badge */}
                      {isLowStock && (
                        <Badge
                          variant="outline"
                          className="absolute top-3 right-3 border-destructive/30 bg-card/90 text-destructive text-xs backdrop-blur-sm"
                        >
                          Quedan {product.stock}
                        </Badge>
                      )}

                      {/* Out of Stock Overlay */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                          <span className="text-lg font-semibold text-muted-foreground">
                            Agotado
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      {categoryName && (
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          {categoryName}
                        </p>
                      )}
                      <h3 className="font-serif text-base font-semibold leading-tight text-card-foreground line-clamp-2 min-h-[2.5rem]">
                        {product.nombre}
                      </h3>

                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-3 w-3",
                              i < Math.floor(rating)
                                ? "fill-chart-4 text-chart-4"
                                : "fill-muted text-muted"
                            )}
                          />
                        ))}
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({reviewCount})
                        </span>
                      </div>

                      {/* Stock indicator */}
                      {!isOutOfStock && !isLowStock && (
                        <p className="text-xs text-emerald-600 font-medium">
                          {product.stock} disponibles
                        </p>
                      )}

                      {/* Price + Add to Cart */}
                      <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                        <div>
                          <p className="text-xl font-bold" style={{ color: colors.primary }}>
                            ${product.precio.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(product)}
                          disabled={isOutOfStock}
                          style={{ backgroundColor: colors.primary, color: "#ffffff" }}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          <span className="sr-only md:not-sr-only">
                            Agregar
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="flex flex-col gap-4">
              {filteredProducts.map((product: any) => {
                const isOutOfStock = product.stock <= 0;
                const rating = productRatings[product._id]?.avgRating || 0;
                const reviewCount = productRatings[product._id]?.count || 0;
                const isLowStock =
                  product.stock > 0 && product.stock <= 5;
                const categoryName = getCategoryName(product);

                return (
                  <div
                    key={product._id}
                    className="group flex items-center gap-6 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {(product.imagen || product.imageUrl) ? (
                        <img
                          src={product.imageUrl || product.imagen}
                          alt={product.nombre}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          {categoryName && (
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              {categoryName}
                            </p>
                          )}
                          <h3 className="font-serif text-lg font-semibold text-card-foreground">
                            {product.nombre}
                          </h3>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold" style={{ color: colors.primary }}>
                            ${product.precio.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-3.5 w-3.5",
                                i < Math.floor(rating)
                                  ? "fill-chart-4 text-chart-4"
                                  : "fill-muted text-muted"
                              )}
                            />
                          ))}
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({reviewCount})
                          </span>
                        </div>
                        {isLowStock && (
                          <div className="flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-destructive">
                              Quedan {product.stock}
                            </span>
                          </div>
                        )}
                        {!isOutOfStock && !isLowStock && (
                          <span className="text-xs text-emerald-600 font-medium">
                            {product.stock} disponibles
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock}
                        className="mt-1 w-fit"
                        style={{ backgroundColor: colors.primary, color: "#ffffff" }}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {isOutOfStock
                          ? "Agotado"
                          : "Agregar al carrito"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Cart Modal */}
      <ClientCartModal
        colors={config.colors}
        typography={config.typography}
        onCheckout={() => {
          setShowCheckoutModal(true);
        }}
      />

      {/* Checkout Modal */}
      {branchId && (
        <EcommerceCheckoutModal
          show={showCheckoutModal}
          onHide={() => {
            setShowCheckoutModal(false);
          }}
          onOrderCreated={() => {
            loadConfig();
          }}
          branchId={branchId}
        />
      )}
    </div>
  );
}
