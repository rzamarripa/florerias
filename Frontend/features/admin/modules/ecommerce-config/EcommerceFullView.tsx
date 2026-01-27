"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ecommerceConfigService } from "./services/ecommerceConfig";
import EcommerceView from "./components/EcommerceView";
import ClientCartModal from "./components/ClientCartModal";
import { useCartStore } from "./store/cartStore";
import type { EcommerceConfig } from "./types";

export default function EcommerceFullView() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<EcommerceConfig | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const preview = searchParams.get("preview") === "true";

  const { getTotalItems } = useCartStore();
  const totalItemsInCart = getTotalItems();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await ecommerceConfigService.getManagerConfig();
      const { config: configData, branch } = response.data;

      setConfig({
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
        featuredElements: configData?.featuredElements || {
          banner: {
            enabled: false,
            title: "",
            text: "",
            images: [],
            button: { name: "Ver mas", link: "#" },
          },
          delivery: {
            pickup: {
              enabled: false,
              time: "30 minutos",
              availableFrom: "09:00",
              availableTo: "21:00",
            },
            delivery: {
              enabled: false,
              time: "45 minutos",
              availableFrom: "09:00",
              availableTo: "21:00",
            },
          },
          promotions: {
            enabled: false,
            items: [],
          },
          productCatalog: {
            enabled: true,
            display: "grid",
            productsPerPage: 12,
            showFilters: true,
            showCategories: true,
            showSearch: true,
            showSort: true,
          },
        },
      });
    } catch (error) {
      console.error("Error al cargar configuracion:", error);
    } finally {
      setLoading(false);
    }
  };

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
        <p>No se pudo cargar la configuracion</p>
      </div>
    );
  }

  // Si es preview mode, mostramos con indicador
  if (preview) {
    return (
      <div className="relative h-screen">
        {/* Shopping Button */}
        <Button
          className="fixed top-20 right-4 z-40 shadow-lg hover:shadow-xl transition-all"
          size="lg"
          style={{
            backgroundColor: config.colors?.primary || "#6366f1",
          }}
          onClick={() => router.push('/ecommerce-catalog')}
        >
          <ShoppingBag className="h-5 w-5 mr-2" />
          Realizar Compras
          {totalItemsInCart > 0 && (
            <Badge variant="destructive" className="ml-2 px-2 py-1">
              {totalItemsInCart}
            </Badge>
          )}
        </Button>

        {/* Cart Modal */}
        <ClientCartModal
          colors={config.colors}
          typography={config.typography}
        />

        <EcommerceView
          header={config.header}
          colors={config.colors}
          typography={config.typography}
          featuredElements={config.featuredElements}
          itemsStock={config.itemsStock}
        />
      </div>
    );
  }

  // Modo normal con botón de compras integrado
  return (
    <div className="relative">
      {/* Shopping Button - Fixed Position */}
      <Button
        className="fixed top-20 right-4 z-40 shadow-lg hover:shadow-xl transition-all"
        size="lg"
        style={{
          backgroundColor: config.colors?.primary || "#6366f1",
        }}
        onClick={() => router.push('/ecommerce-catalog')}
      >
        <ShoppingBag className="h-5 w-5 mr-2" />
        Realizar Compras
        {totalItemsInCart > 0 && (
          <Badge variant="destructive" className="ml-2 px-2 py-1">
            {totalItemsInCart}
          </Badge>
        )}
      </Button>

      {/* Cart Modal */}
      <ClientCartModal colors={config.colors} typography={config.typography} />

      {/* Main Ecommerce View */}
      <EcommerceView
        header={config.header}
        colors={config.colors}
        typography={config.typography}
        featuredElements={config.featuredElements}
        itemsStock={config.itemsStock}
      />
    </div>
  );
}
