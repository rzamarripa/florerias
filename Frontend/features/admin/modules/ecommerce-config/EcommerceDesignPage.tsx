"use client";

import { useState, useEffect } from "react";
import { Card, Nav, Tab, Spinner, Button } from "react-bootstrap";
import { TbArrowLeft, TbZoomIn, TbZoomOut, TbZoomReset } from "react-icons/tb";
import Link from "next/link";
import { toast } from "react-toastify";
import { ecommerceConfigService } from "./services/ecommerceConfig";
import {
  uploadEcommerceLogo,
  uploadEcommerceBanner,
  uploadEcommerceCarouselImage,
  deleteFile
} from "@/services/firebaseStorage";
import type {
  EcommerceConfig,
  EcommerceConfigColors,
  EcommerceConfigTypography,
  EcommerceConfigFeaturedElements,
  TopbarItem,
  PromotionItem
} from "./types";
import HeaderTab from "./components/tabs/HeaderTab";
import TemplatesTab from "./components/tabs/TemplatesTab";
import ColorsTab from "./components/tabs/ColorsTab";
import TypographyTab from "./components/tabs/TypographyTab";
import FeaturedElementsTab from "./components/tabs/elements/FeaturedElementsTab";
import EcommerceView from "./components/EcommerceView";

export default function EcommerceDesignPage() {
  const [activeKey, setActiveKey] = useState("encabezado");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<EcommerceConfig | null>(null);
  const [companyId, setCompanyId] = useState<string>("");
  const [branchId, setBranchId] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState(100); // Start at 100% (which represents the scaled view)
  
  // Estados para cada sección
  const [pageTitle, setPageTitle] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [topbarItems, setTopbarItems] = useState<TopbarItem[]>([]);
  
  const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'modern' | 'minimalist' | 'elegant'>('modern');
  
  const [colors, setColors] = useState<EcommerceConfigColors>({
    primary: "#6366f1",
    secondary: "#10b981",
    background: "#ffffff",
    text: "#1f2937"
  });
  
  const [typography, setTypography] = useState<EcommerceConfigTypography>({
    titleFont: "Inter",
    titleSize: 36,
    textFont: "Inter",
    subtitleSize: 24,
    normalSize: 16
  });
  
  // Estados para elementos destacados - Banner
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerText, setBannerText] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [bannerButtonName, setBannerButtonName] = useState("Ver más");
  const [bannerButtonLink, setBannerButtonLink] = useState("#");
  
  // Estados para carrusel
  const [carouselEnabled, setCarouselEnabled] = useState(true);
  const [carouselImages, setCarouselImages] = useState<Array<{ url: string; path: string }>>([]);
  const [carouselFiles, setCarouselFiles] = useState<File[]>([]);
  
  // Estados para delivery
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [pickupTime, setPickupTime] = useState("30 minutos");
  const [pickupFrom, setPickupFrom] = useState("09:00");
  const [pickupTo, setPickupTo] = useState("21:00");
  
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState("45 minutos");
  const [deliveryFrom, setDeliveryFrom] = useState("09:00");
  const [deliveryTo, setDeliveryTo] = useState("21:00");
  
  // Estados para promociones
  const [promotionsEnabled, setPromotionsEnabled] = useState(true);
  const [promotionItems, setPromotionItems] = useState<PromotionItem[]>([]);
  
  // Estados para catálogo de productos
  const [catalogEnabled, setCatalogEnabled] = useState(true);
  const [catalogDisplay, setCatalogDisplay] = useState("grid");
  const [catalogProductsPerPage, setCatalogProductsPerPage] = useState(12);
  const [catalogShowFilters, setCatalogShowFilters] = useState(true);
  const [catalogShowCategories, setCatalogShowCategories] = useState(true);
  const [catalogShowSearch, setCatalogShowSearch] = useState(true);
  const [catalogShowSort, setCatalogShowSort] = useState(true);

  const tabs = [
    { key: "encabezado", label: "Encabezado" },
    { key: "plantillas", label: "Plantillas" },
    { key: "colores", label: "Colores" },
    { key: "tipografias", label: "Tipografías" },
    { key: "elementos", label: "Elementos destacados" },
  ];

  // Crear objeto unificado de featuredElements
  const featuredElements: EcommerceConfigFeaturedElements = {
    banner: {
      enabled: bannerEnabled,
      title: bannerTitle,
      text: bannerText,
      imageUrl: bannerUrl,
      imagePath: config?.featuredElements?.banner?.imagePath || "",
      button: {
        name: bannerButtonName,
        link: bannerButtonLink
      }
    },
    carousel: {
      enabled: carouselEnabled,
      images: carouselImages
    },
    delivery: {
      pickup: {
        enabled: pickupEnabled,
        time: pickupTime,
        availableFrom: pickupFrom,
        availableTo: pickupTo
      },
      delivery: {
        enabled: deliveryEnabled,
        time: deliveryTime,
        availableFrom: deliveryFrom,
        availableTo: deliveryTo
      }
    },
    promotions: {
      enabled: promotionsEnabled,
      items: promotionItems
    },
    productCatalog: {
      enabled: catalogEnabled,
      display: catalogDisplay,
      productsPerPage: catalogProductsPerPage,
      showFilters: catalogShowFilters,
      showCategories: catalogShowCategories,
      showSearch: catalogShowSearch,
      showSort: catalogShowSort
    }
  };

  const setFeaturedElements = (newElements: EcommerceConfigFeaturedElements) => {
    // Update banner
    setBannerEnabled(newElements.banner.enabled);
    setBannerTitle(newElements.banner.title || "");
    setBannerText(newElements.banner.text || "");
    setBannerUrl(newElements.banner.imageUrl || "");
    setBannerButtonName(newElements.banner.button?.name || "Ver más");
    setBannerButtonLink(newElements.banner.button?.link || "#");
    
    // Update carousel
    setCarouselEnabled(newElements.carousel.enabled);
    setCarouselImages(newElements.carousel.images);
    
    // Update delivery
    setPickupEnabled(newElements.delivery.pickup.enabled);
    setPickupTime(newElements.delivery.pickup.time);
    setPickupFrom(newElements.delivery.pickup.availableFrom);
    setPickupTo(newElements.delivery.pickup.availableTo);
    setDeliveryEnabled(newElements.delivery.delivery.enabled);
    setDeliveryTime(newElements.delivery.delivery.time);
    setDeliveryFrom(newElements.delivery.delivery.availableFrom);
    setDeliveryTo(newElements.delivery.delivery.availableTo);
    
    // Update promotions
    setPromotionsEnabled(newElements.promotions.enabled);
    setPromotionItems(newElements.promotions.items);
    
    // Update product catalog
    setCatalogEnabled(newElements.productCatalog.enabled);
    setCatalogDisplay(newElements.productCatalog.display || "grid");
    setCatalogProductsPerPage(newElements.productCatalog.productsPerPage || 12);
    setCatalogShowFilters(newElements.productCatalog.showFilters !== false);
    setCatalogShowCategories(newElements.productCatalog.showCategories !== false);
    setCatalogShowSearch(newElements.productCatalog.showSearch !== false);
    setCatalogShowSort(newElements.productCatalog.showSort !== false);
  };

  // Cargar configuración al montar
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await ecommerceConfigService.getManagerConfig();
      const { config, branch, companyId } = response.data;
      
      if (companyId) {
        setCompanyId(companyId);
      }
      if (branch?._id) {
        setBranchId(branch._id);
      }
      
      setConfig(config);
      
      if (config) {
        if (config.header) {
          setPageTitle(config.header.pageTitle || branch?.branchName || "");
          setLogoUrl(config.header.logoUrl || "");
          setTopbarItems(config.header.topbar || []);
        } else {
          setPageTitle(branch?.branchName || "");
        }
        
        if (config.template) {
          setSelectedTemplate(config.template);
        }
        
        if (config.colors) {
          setColors(config.colors);
        }
        
        if (config.typography) {
          setTypography(config.typography);
        }
        
        if (config.featuredElements) {
          const featured = config.featuredElements;
          
          if (featured.banner) {
            setBannerEnabled(featured.banner.enabled);
            setBannerTitle(featured.banner.title || "");
            setBannerText(featured.banner.text || "");
            setBannerUrl(featured.banner.imageUrl || "");
            setBannerButtonName(featured.banner.button?.name || "Ver más");
            setBannerButtonLink(featured.banner.button?.link || "#");
          }
          
          if (featured.carousel) {
            setCarouselEnabled(featured.carousel.enabled);
            setCarouselImages(featured.carousel.images || []);
          }
          
          if (featured.delivery) {
            const { pickup, delivery } = featured.delivery;
            
            setPickupEnabled(pickup.enabled);
            setPickupTime(pickup.time);
            setPickupFrom(pickup.availableFrom);
            setPickupTo(pickup.availableTo);
            
            setDeliveryEnabled(delivery.enabled);
            setDeliveryTime(delivery.time);
            setDeliveryFrom(delivery.availableFrom);
            setDeliveryTo(delivery.availableTo);
          }
          
          if (featured.promotions) {
            setPromotionsEnabled(featured.promotions.enabled);
            setPromotionItems(featured.promotions.items || []);
          }
          
          if (featured.productCatalog) {
            setCatalogEnabled(featured.productCatalog.enabled);
            setCatalogDisplay(featured.productCatalog.display || "grid");
            setCatalogProductsPerPage(featured.productCatalog.productsPerPage || 12);
            setCatalogShowFilters(featured.productCatalog.showFilters !== false);
            setCatalogShowCategories(featured.productCatalog.showCategories !== false);
            setCatalogShowSearch(featured.productCatalog.showSearch !== false);
            setCatalogShowSort(featured.productCatalog.showSort !== false);
          }
        }
      } else {
        if (branch?.branchName) {
          setPageTitle(branch.branchName);
        }
      }
    } catch (error: any) {
      console.error("Error al cargar configuración:", error);
      toast.error("Error al cargar la configuración");
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejar topbar
  const addTopbarItem = () => {
    const newItem: TopbarItem = {
      name: "",
      link: "",
      order: topbarItems.length
    };
    setTopbarItems([...topbarItems, newItem]);
  };

  const updateTopbarItem = (index: number, field: keyof TopbarItem, value: string | number) => {
    const updated = [...topbarItems];
    updated[index] = { ...updated[index], [field]: value };
    setTopbarItems(updated);
  };

  const removeTopbarItem = (index: number) => {
    setTopbarItems(topbarItems.filter((_, i) => i !== index));
  };

  // Funciones para manejar promociones
  const addPromotionItem = () => {
    const newPromotion: PromotionItem = {
      name: "",
      text: "",
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    setPromotionItems([...promotionItems, newPromotion]);
  };

  const updatePromotionItem = (index: number, field: keyof PromotionItem, value: string) => {
    const updated = [...promotionItems];
    updated[index] = { ...updated[index], [field]: value };
    setPromotionItems(updated);
  };

  const removePromotionItem = (index: number) => {
    setPromotionItems(promotionItems.filter((_, i) => i !== index));
  };

  // Guardar encabezado
  const saveHeader = async () => {
    if (!companyId || !branchId) {
      toast.error("No se ha podido obtener la información de la sucursal");
      return;
    }
    
    const validTopbarItems = topbarItems.filter(item => item.name && item.link);
    
    try {
      setSaving(true);
      
      let finalLogoUrl = logoUrl;
      let finalLogoPath = config?.header?.logoPath || "";
      
      if (logoFile) {
        if (config?.header?.logoPath) {
          await deleteFile(config.header.logoPath).catch(console.error);
        }
        
        const logoResult = await uploadEcommerceLogo(logoFile, companyId, branchId);
        finalLogoUrl = logoResult.url;
        finalLogoPath = logoResult.path;
      }
      
      let updatedConfig;
      if (!config?._id) {
        updatedConfig = await ecommerceConfigService.createConfig({
          companyId: companyId,
          branchId: branchId,
          header: {
            pageTitle,
            logoUrl: finalLogoUrl,
            logoPath: finalLogoPath,
            topbar: validTopbarItems
          }
        });
        toast.success("Configuración creada correctamente");
      } else {
        updatedConfig = await ecommerceConfigService.updateHeader(config._id, {
          pageTitle,
          logoUrl: finalLogoUrl,
          logoPath: finalLogoPath,
          topbar: validTopbarItems
        });
        toast.success("Encabezado actualizado correctamente");
      }
      
      setConfig(updatedConfig);
      setLogoUrl(finalLogoUrl);
      setLogoFile(null);
    } catch (error: any) {
      console.error("Error al guardar encabezado:", error);
      toast.error("Error al guardar el encabezado");
    } finally {
      setSaving(false);
    }
  };

  // Guardar plantilla
  const saveTemplate = async () => {
    if (!companyId || !branchId) {
      toast.error("No se ha podido obtener la información de la sucursal");
      return;
    }
    
    try {
      setSaving(true);
      
      let updatedConfig;
      if (!config?._id) {
        updatedConfig = await ecommerceConfigService.createConfig({
          companyId: companyId,
          branchId: branchId,
          template: selectedTemplate
        });
        toast.success("Configuración creada correctamente");
      } else {
        updatedConfig = await ecommerceConfigService.updateTemplate(config._id, selectedTemplate);
        toast.success("Plantilla actualizada correctamente");
      }
      
      setConfig(updatedConfig);
    } catch (error: any) {
      console.error("Error al guardar plantilla:", error);
      toast.error("Error al guardar la plantilla");
    } finally {
      setSaving(false);
    }
  };

  // Guardar colores
  const saveColors = async () => {
    if (!companyId || !branchId) {
      toast.error("No se ha podido obtener la información de la sucursal");
      return;
    }
    
    try {
      setSaving(true);
      
      let updatedConfig;
      if (!config?._id) {
        updatedConfig = await ecommerceConfigService.createConfig({
          companyId: companyId,
          branchId: branchId,
          colors: colors
        });
        toast.success("Configuración creada correctamente");
      } else {
        updatedConfig = await ecommerceConfigService.updateColors(config._id, colors);
        toast.success("Colores actualizados correctamente");
      }
      
      setConfig(updatedConfig);
    } catch (error: any) {
      console.error("Error al guardar colores:", error);
      toast.error("Error al guardar los colores");
    } finally {
      setSaving(false);
    }
  };

  // Guardar tipografías
  const saveTypography = async () => {
    if (!companyId || !branchId) {
      toast.error("No se ha podido obtener la información de la sucursal");
      return;
    }
    
    try {
      setSaving(true);
      
      let updatedConfig;
      if (!config?._id) {
        updatedConfig = await ecommerceConfigService.createConfig({
          companyId: companyId,
          branchId: branchId,
          typography: typography
        });
        toast.success("Configuración creada correctamente");
      } else {
        updatedConfig = await ecommerceConfigService.updateTypography(config._id, typography);
        toast.success("Tipografías actualizadas correctamente");
      }
      
      setConfig(updatedConfig);
    } catch (error: any) {
      console.error("Error al guardar tipografías:", error);
      toast.error("Error al guardar las tipografías");
    } finally {
      setSaving(false);
    }
  };

  // Guardar elementos destacados
  const saveFeaturedElements = async () => {
    if (!companyId || !branchId) {
      toast.error("No se ha podido obtener la información de la sucursal");
      return;
    }
    
    try {
      setSaving(true);
      
      let finalBannerUrl = bannerUrl;
      let finalBannerPath = config?.featuredElements?.banner?.imagePath || "";
      
      if (bannerFile) {
        if (config?.featuredElements?.banner?.imagePath) {
          await deleteFile(config.featuredElements.banner.imagePath).catch(console.error);
        }
        
        const bannerResult = await uploadEcommerceBanner(bannerFile, companyId, branchId);
        finalBannerUrl = bannerResult.url;
        finalBannerPath = bannerResult.path;
      }
      
      const finalCarouselImages = [...carouselImages];
      
      if (carouselFiles.length > 0) {
        toast.info(`Subiendo ${carouselFiles.length} imágenes del carrusel...`);
        
        for (let i = 0; i < carouselFiles.length; i++) {
          const file = carouselFiles[i];
          if (file) {
            try {
              const result = await uploadEcommerceCarouselImage(
                file, 
                companyId, 
                branchId, 
                finalCarouselImages.length + i
              );
              finalCarouselImages.push({ url: result.url, path: result.path });
            } catch (error) {
              console.error(`Error subiendo imagen ${i + 1}:`, error);
              toast.error(`Error subiendo imagen ${file.name}`);
            }
          }
        }
      }
      
      const limitedCarouselImages = finalCarouselImages.slice(0, 5);
      const validPromotions = promotionItems.filter(item => item.name && item.name.trim() !== '');
      
      let updatedConfig;
      const featuredElementsData = {
        banner: {
          enabled: bannerEnabled,
          title: bannerTitle,
          text: bannerText,
          imageUrl: finalBannerUrl,
          imagePath: finalBannerPath,
          button: {
            name: bannerButtonName,
            link: bannerButtonLink
          }
        },
        carousel: {
          enabled: carouselEnabled,
          images: limitedCarouselImages
        },
        delivery: {
          pickup: {
            enabled: pickupEnabled,
            time: pickupTime,
            availableFrom: pickupFrom,
            availableTo: pickupTo
          },
          delivery: {
            enabled: deliveryEnabled,
            time: deliveryTime,
            availableFrom: deliveryFrom,
            availableTo: deliveryTo
          }
        },
        promotions: {
          enabled: promotionsEnabled,
          items: validPromotions
        },
        productCatalog: {
          enabled: catalogEnabled,
          display: catalogDisplay,
          productsPerPage: catalogProductsPerPage,
          showFilters: catalogShowFilters,
          showCategories: catalogShowCategories,
          showSearch: catalogShowSearch,
          showSort: catalogShowSort
        }
      };
      
      if (!config?._id) {
        updatedConfig = await ecommerceConfigService.createConfig({
          companyId: companyId,
          branchId: branchId,
          featuredElements: featuredElementsData
        });
        toast.success("Configuración creada correctamente");
      } else {
        updatedConfig = await ecommerceConfigService.updateFeaturedElements(config._id, featuredElementsData);
        toast.success("Elementos destacados actualizados correctamente");
      }
      
      setConfig(updatedConfig);
      setBannerUrl(finalBannerUrl);
      setCarouselImages(limitedCarouselImages);
      setBannerFile(null);
      setCarouselFiles([]);
    } catch (error: any) {
      console.error("Error al guardar elementos destacados:", error);
      toast.error("Error al guardar los elementos destacados");
    } finally {
      setSaving(false);
    }
  };

  // Eliminar imagen del carrusel
  const removeCarouselImage = async (index: number) => {
    const image = carouselImages[index];
    if (image?.path) {
      await deleteFile(image.path).catch(console.error);
    }
    
    const newImages = carouselImages.filter((_, i) => i !== index);
    setCarouselImages(newImages);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="d-flex flex-column h-100">
      {/* Header */}
      <div className="d-flex align-items-center mb-4">
        <Link href="/" className="btn btn-link text-muted p-0 me-3">
          <TbArrowLeft className="fs-5" />
        </Link>
        <h4 className="mb-0">Diseño</h4>
      </div>

      {/* Main Container with Config Panel and Preview */}
      <div className="d-flex flex-grow-1 gap-3" style={{ height: 'calc(100vh - 100px)' }}>
        {/* Configuration Panel */}
        <Card className="border-0 shadow-sm flex-grow-1" style={{ maxWidth: '60%' }}>
          <Card.Body className="p-0 d-flex flex-column">
          {/* Tabs Navigation */}
          <Nav variant="tabs" className="nav-tabs-custom border-bottom-0">
            {tabs.map((tab) => (
              <Nav.Item key={tab.key}>
                <Nav.Link
                  active={activeKey === tab.key}
                  onClick={() => setActiveKey(tab.key)}
                  className={`px-4 py-3 ${
                    activeKey === tab.key
                      ? "border-bottom-2 border-primary text-primary fw-semibold"
                      : "text-muted"
                  }`}
                  style={{
                    borderBottom: activeKey === tab.key ? "2px solid var(--bs-primary)" : "none",
                    cursor: "pointer"
                  }}
                >
                  {tab.label}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>

          {/* Tab Content */}
          <div className="p-4 overflow-auto flex-grow-1">
            <Tab.Container activeKey={activeKey}>
              <Tab.Content>
                {/* Encabezado Tab */}
                <Tab.Pane eventKey="encabezado">
                  <HeaderTab
                    pageTitle={pageTitle}
                    setPageTitle={setPageTitle}
                    logoUrl={logoUrl}
                    logoFile={logoFile}
                    setLogoFile={setLogoFile}
                    topbarItems={topbarItems}
                    setTopbarItems={setTopbarItems}
                    saving={saving}
                    onSave={saveHeader}
                  />
                </Tab.Pane>

                {/* Plantillas Tab */}
                <Tab.Pane eventKey="plantillas">
                  <TemplatesTab
                    selectedTemplate={selectedTemplate}
                    setSelectedTemplate={setSelectedTemplate}
                    saving={saving}
                    onSave={saveTemplate}
                  />
                </Tab.Pane>

                {/* Colores Tab */}
                <Tab.Pane eventKey="colores">
                  <ColorsTab
                    colors={colors}
                    setColors={setColors}
                    saving={saving}
                    onSave={saveColors}
                  />
                </Tab.Pane>

                {/* Tipografías Tab */}
                <Tab.Pane eventKey="tipografias">
                  <TypographyTab
                    typography={typography}
                    setTypography={setTypography}
                    saving={saving}
                    onSave={saveTypography}
                  />
                </Tab.Pane>

                {/* Elementos destacados Tab */}
                <Tab.Pane eventKey="elementos">
                  <FeaturedElementsTab
                    featuredElements={featuredElements}
                    setFeaturedElements={setFeaturedElements}
                    carouselFiles={carouselFiles}
                    setCarouselFiles={setCarouselFiles}
                    bannerFile={bannerFile}
                    setBannerFile={setBannerFile}
                    saving={saving}
                    onSave={saveFeaturedElements}
                  />
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </div>
        </Card.Body>
      </Card>

      {/* Preview Panel */}
      <div className="border rounded shadow-sm d-flex flex-column" style={{ width: '40%', backgroundColor: '#f8f9fa' }}>
        {/* Zoom Controls */}
        <div className="d-flex align-items-center justify-content-between px-2 py-1 border-bottom bg-white">
          <div className="d-flex align-items-center gap-1">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
              disabled={zoomLevel <= 50}
              style={{ padding: '2px 6px', fontSize: '12px' }}
            >
              <TbZoomOut size={12} />
            </Button>
            <span className="badge bg-secondary px-2 py-1" style={{ minWidth: '45px', fontSize: '10px' }}>
              {zoomLevel}%
            </span>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
              disabled={zoomLevel >= 200}
              style={{ padding: '2px 6px', fontSize: '12px' }}
            >
              <TbZoomIn size={12} />
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setZoomLevel(100)}
              style={{ padding: '2px 6px', fontSize: '12px' }}
            >
              <TbZoomReset size={12} />
            </Button>
          </div>
          <span className="text-muted" style={{ fontSize: '11px' }}>Vista previa</span>
        </div>
        
        {/* Preview Container */}
        <div 
          className="flex-grow-1 position-relative overflow-auto" 
          style={{ 
            backgroundColor: '#e2e8f0',
            minHeight: 0
          }}
        >
          <div 
            className="position-absolute"
            style={{ 
              width: `${100 / 0.3}%`,
              height: `${100 / 0.3}%`,
              transform: `scale(${(zoomLevel * 0.3) / 100})`,
              transformOrigin: 'top left',
              left: 0,
              top: 0
            }}
          >
            <EcommerceView
              header={{
                pageTitle: pageTitle,
                logoUrl: logoUrl,
                topbar: topbarItems,
                logoPath: config?.header?.logoPath || ""
              }}
              colors={colors}
              typography={typography}
              featuredElements={featuredElements}
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}