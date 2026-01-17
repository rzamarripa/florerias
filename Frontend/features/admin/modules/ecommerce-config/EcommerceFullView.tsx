"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ecommerceConfigService } from "./services/ecommerceConfig";
import EcommerceView from "./components/EcommerceView";
import type { EcommerceConfig } from "./types";

export default function EcommerceFullView() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<EcommerceConfig | null>(null);
  const searchParams = useSearchParams();
  const preview = searchParams.get("preview") === "true";

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
          topbar: []
        },
        colors: configData?.colors || {
          primary: "#6366f1",
          secondary: "#10b981",
          background: "#ffffff",
          text: "#1f2937"
        },
        typography: configData?.typography || {
          titleFont: "Inter",
          titleSize: 36,
          textFont: "Inter",
          subtitleSize: 24,
          normalSize: 16
        },
        featuredElements: configData?.featuredElements || {
          banner: {
            enabled: false,
            title: "",
            text: "",
            imageUrl: "",
            imagePath: "",
            button: { name: "Ver mas", link: "#" }
          },
          carousel: {
            enabled: false,
            images: []
          },
          delivery: {
            pickup: {
              enabled: false,
              time: "30 minutos",
              availableFrom: "09:00",
              availableTo: "21:00"
            },
            delivery: {
              enabled: false,
              time: "45 minutos",
              availableFrom: "09:00",
              availableTo: "21:00"
            }
          },
          promotions: {
            enabled: false,
            items: []
          },
          productCatalog: {
            enabled: true,
            display: "grid",
            productsPerPage: 12,
            showFilters: true,
            showCategories: true,
            showSearch: true,
            showSort: true
          }
        }
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
        {/* Preview Badge */}
        <div
          className="fixed top-0 left-1/2 -translate-x-1/2 mt-3 px-4 py-2 rounded-full shadow-lg z-[9999] font-semibold text-sm text-white backdrop-blur-sm"
          style={{
            backgroundColor: "rgba(99, 102, 241, 0.95)",
          }}
        >
          Vista previa del E-commerce
        </div>

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

  // Modo normal sin indicador
  return (
    <EcommerceView
      header={config.header}
      colors={config.colors}
      typography={config.typography}
      featuredElements={config.featuredElements}
      itemsStock={config.itemsStock}
    />
  );
}
