"use client";

import { useState, useEffect } from "react";
import { Card, Nav, Tab, Form, Button, Row, Col, Spinner } from "react-bootstrap";
import { TbArrowLeft, TbUpload, TbTrash, TbPlus } from "react-icons/tb";
import Link from "next/link";
import { toast } from "react-toastify";
import { ecommerceConfigService } from "./services/ecommerceConfig";
import {
  uploadEcommerceLogo,
  uploadEcommerceCover,
  uploadEcommerceBanner,
  uploadEcommerceCarouselImage,
  deleteFile
} from "@/services/firebaseStorage";
import type {
  EcommerceConfig,
  EcommerceConfigColors,
  EcommerceConfigTypography,
  ManagerConfigResponse
} from "./types";

export default function EcommerceDesignPage() {
  const [activeKey, setActiveKey] = useState("encabezado");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<EcommerceConfig | null>(null);
  const [companyId, setCompanyId] = useState<string>("");
  const [branchId, setBranchId] = useState<string>("");
  
  // Estados para cada sección
  const [businessName, setBusinessName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string>("");
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>("modern");
  
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
  
  // Estados para elementos destacados
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [bannerButtonText, setBannerButtonText] = useState("Ver ofertas");
  
  const [carouselEnabled, setCarouselEnabled] = useState(true);
  const [carouselImages, setCarouselImages] = useState<Array<{ url: string; path: string }>>([]);
  const [carouselFiles, setCarouselFiles] = useState<File[]>([]);
  
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [pickupTime, setPickupTime] = useState("30 minutos");
  const [pickupFrom, setPickupFrom] = useState("09:00");
  const [pickupTo, setPickupTo] = useState("21:00");
  
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState("45 minutos");
  const [deliveryFrom, setDeliveryFrom] = useState("09:00");
  const [deliveryTo, setDeliveryTo] = useState("21:00");
  
  const [featuredProductsEnabled, setFeaturedProductsEnabled] = useState(true);
  const [featuredProductsTitle, setFeaturedProductsTitle] = useState("Productos destacados");
  const [featuredProductsQuantity, setFeaturedProductsQuantity] = useState(8);
  
  const [promotionsEnabled, setPromotionsEnabled] = useState(true);
  const [promotionsQuantity, setPromotionsQuantity] = useState(4);

  const tabs = [
    { key: "encabezado", label: "Encabezado" },
    { key: "plantillas", label: "Plantillas" },
    { key: "colores", label: "Colores" },
    { key: "tipografias", label: "Tipografías" },
    { key: "elementos", label: "Elementos destacados" },
  ];

  // Cargar configuración al montar
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      console.log("Cargando configuración del gerente...");
      const response: ManagerConfigResponse = await ecommerceConfigService.getManagerConfig();
      console.log("Respuesta del servidor:", response);
      
      // Siempre establecer companyId y branchId aunque no haya config
      if (response.companyId) {
        setCompanyId(response.companyId);
      }
      if (response.branch?._id) {
        setBranchId(response.branch._id);
      }
      
      // La config puede ser null si no existe
      setConfig(response.config);
      
      console.log("Config establecida:", response.config);
      console.log("Config._id:", response.config?._id);
      console.log("CompanyId:", response.companyId);
      console.log("BranchId:", response.branch?._id);
      
      // Cargar datos en los estados SOLO si existe config
      if (response.config) {
        if (response.config.header) {
          setBusinessName(response.config.header.businessName || response.branch?.branchName || "");
          setLogoUrl(response.config.header.logoUrl || "");
          setCoverUrl(response.config.header.coverUrl || "");
        } else {
          // Si no hay header, usar el nombre de la sucursal
          setBusinessName(response.branch?.branchName || "");
        }
        
        if (response.config.template) {
          setSelectedTemplate(response.config.template);
        }
        
        if (response.config.colors) {
          setColors(response.config.colors);
        }
        
        if (response.config.typography) {
          setTypography(response.config.typography);
        }
        
        if (response.config.featuredElements) {
          const featured = response.config.featuredElements;
          
          if (featured.banner) {
            setBannerEnabled(featured.banner.enabled);
            setBannerUrl(featured.banner.imageUrl || "");
            setBannerButtonText(featured.banner.buttonText || "Ver ofertas");
          }
          
          if (featured.carousel) {
            setCarouselEnabled(featured.carousel.enabled);
            setCarouselImages(featured.carousel.images || []);
          }
          
          if (featured.deliveryData) {
            const { pickup, delivery } = featured.deliveryData;
            
            setPickupEnabled(pickup.enabled);
            setPickupTime(pickup.deliveryTime);
            setPickupFrom(pickup.availableFrom);
            setPickupTo(pickup.availableTo);
            
            setDeliveryEnabled(delivery.enabled);
            setDeliveryTime(delivery.deliveryTime);
            setDeliveryFrom(delivery.availableFrom);
            setDeliveryTo(delivery.availableTo);
          }
          
          if (featured.featuredProducts) {
            setFeaturedProductsEnabled(featured.featuredProducts.enabled);
            setFeaturedProductsTitle(featured.featuredProducts.title);
            setFeaturedProductsQuantity(featured.featuredProducts.quantity);
          }
          
          if (featured.promotions) {
            setPromotionsEnabled(featured.promotions.enabled);
            setPromotionsQuantity(featured.promotions.quantity);
          }
        }
      } else {
        // Si no hay config, usar el nombre de la sucursal por defecto
        if (response.branch?.branchName) {
          setBusinessName(response.branch.branchName);
        }
      }
    } catch (error: any) {
      console.error("Error al cargar configuración:", error);
      toast.error("Error al cargar la configuración");
    } finally {
      setLoading(false);
    }
  };

  // Guardar encabezado
  const saveHeader = async () => {
    console.log("saveHeader llamado");
    console.log("config:", config);
    console.log("config._id:", config?._id);
    console.log("companyId:", companyId);
    console.log("branchId:", branchId);
    
    if (!companyId || !branchId) {
      toast.error("No se ha podido obtener la información de la sucursal");
      return;
    }
    
    try {
      setSaving(true);
      console.log("Enviando petición para guardar header...");
      
      let finalLogoUrl = logoUrl;
      let finalLogoPath = config?.header?.logoPath || "";
      let finalCoverUrl = coverUrl;
      let finalCoverPath = config?.header?.coverPath || "";
      
      // Subir logo si hay archivo nuevo
      if (logoFile) {
        // Eliminar logo anterior si existe
        if (config?.header?.logoPath) {
          await deleteFile(config.header.logoPath).catch(console.error);
        }
        
        const logoResult = await uploadEcommerceLogo(logoFile, companyId, branchId);
        finalLogoUrl = logoResult.url;
        finalLogoPath = logoResult.path;
      }
      
      // Subir portada si hay archivo nuevo
      if (coverFile) {
        // Eliminar portada anterior si existe
        if (config?.header?.coverPath) {
          await deleteFile(config.header.coverPath).catch(console.error);
        }
        
        const coverResult = await uploadEcommerceCover(coverFile, companyId, branchId);
        finalCoverUrl = coverResult.url;
        finalCoverPath = coverResult.path;
      }
      
      // Si no existe config, crear una nueva
      let updatedConfig;
      if (!config?._id) {
        console.log("No existe configuración, creando nueva...");
        updatedConfig = await ecommerceConfigService.createConfig({
          companyId: companyId,
          branchId: branchId,
          header: {
            businessName,
            logoUrl: finalLogoUrl,
            logoPath: finalLogoPath,
            coverUrl: finalCoverUrl,
            coverPath: finalCoverPath
          }
        });
        toast.success("Configuración creada correctamente");
      } else {
        console.log("Actualizando configuración existente...");
        updatedConfig = await ecommerceConfigService.updateHeader(config._id, {
          businessName,
          logoUrl: finalLogoUrl,
          logoPath: finalLogoPath,
          coverUrl: finalCoverUrl,
          coverPath: finalCoverPath
        });
        toast.success("Encabezado actualizado correctamente");
      }
      
      setConfig(updatedConfig);
      setLogoUrl(finalLogoUrl);
      setCoverUrl(finalCoverUrl);
      setLogoFile(null);
      setCoverFile(null);
    } catch (error: any) {
      console.error("Error al guardar encabezado:", error);
      toast.error("Error al guardar el encabezado");
    } finally {
      setSaving(false);
    }
  };

  // Guardar plantilla
  const saveTemplate = async () => {
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
    try {
      setSaving(true);
      
      let finalBannerUrl = bannerUrl;
      let finalBannerPath = config?.featuredElements?.banner?.imagePath || "";
      
      // Subir banner si hay archivo nuevo
      if (bannerFile) {
        // Eliminar banner anterior si existe
        if (config?.featuredElements?.banner?.imagePath) {
          await deleteFile(config.featuredElements.banner.imagePath).catch(console.error);
        }
        
        const bannerResult = await uploadEcommerceBanner(bannerFile, companyId, branchId);
        finalBannerUrl = bannerResult.url;
        finalBannerPath = bannerResult.path;
      }
      
      // Subir imágenes del carrusel
      const finalCarouselImages = [...carouselImages];
      for (let i = 0; i < carouselFiles.length; i++) {
        const file = carouselFiles[i];
        if (file) {
          const result = await uploadEcommerceCarouselImage(file, companyId, branchId, i);
          finalCarouselImages.push({ url: result.url, path: result.path });
        }
      }
      
      // Limitar a 5 imágenes máximo
      const limitedCarouselImages = finalCarouselImages.slice(0, 5);
      
      let updatedConfig;
      const featuredElementsData = {
        banner: {
          enabled: bannerEnabled,
          imageUrl: finalBannerUrl,
          imagePath: finalBannerPath,
          buttonText: bannerButtonText
        },
        carousel: {
          enabled: carouselEnabled,
          images: limitedCarouselImages
        },
        deliveryData: {
          pickup: {
            enabled: pickupEnabled,
            deliveryTime: pickupTime,
            availableFrom: pickupFrom,
            availableTo: pickupTo
          },
          delivery: {
            enabled: deliveryEnabled,
            deliveryTime: deliveryTime,
            availableFrom: deliveryFrom,
            availableTo: deliveryTo
          }
        },
        featuredProducts: {
          enabled: featuredProductsEnabled,
          title: featuredProductsTitle,
          quantity: featuredProductsQuantity
        },
        promotions: {
          enabled: promotionsEnabled,
          quantity: promotionsQuantity
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
    <>
      {/* Header */}
      <div className="d-flex align-items-center mb-4">
        <Link href="/" className="btn btn-link text-muted p-0 me-3">
          <TbArrowLeft className="fs-5" />
        </Link>
        <h4 className="mb-0">Diseño</h4>
      </div>

      {/* Main Card with Tabs */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
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
          <div className="p-4">
            <Tab.Container activeKey={activeKey}>
              <Tab.Content>
                {/* Encabezado Tab */}
                <Tab.Pane eventKey="encabezado">
                  <div>
                    <h5 className="mb-4">Datos del negocio</h5>
                    <Form>
                      <Row className="g-3 mb-3">
                        <Col md={12}>
                          <Form.Group>
                            <Form.Label className="fw-medium">
                              Nombre de tu negocio <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={businessName}
                              onChange={(e) => setBusinessName(e.target.value)}
                              placeholder="Ingresa el nombre de tu negocio"
                              maxLength={50}
                            />
                            <Form.Text className="text-muted">
                              {businessName.length}/50
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row className="g-3">
                        {/* Logo */}
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-medium">
                              Logo del negocio <span className="text-danger">*</span>
                            </Form.Label>
                            <div className="border rounded p-4 text-center bg-light">
                              {logoUrl ? (
                                <div className="mb-3">
                                  <img 
                                    src={logoUrl} 
                                    alt="Logo" 
                                    style={{ maxWidth: "200px", maxHeight: "150px" }}
                                  />
                                </div>
                              ) : (
                                <div className="mb-3">
                                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <polyline points="21 15 16 10 5 21"/>
                                  </svg>
                                </div>
                              )}
                              <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const file = e.target.files?.[0];
                                  if (file && file.size <= 5 * 1024 * 1024) {
                                    setLogoFile(file);
                                  } else {
                                    toast.error("El archivo debe ser menor a 5MB");
                                  }
                                }}
                                className="d-none"
                                id="logo-upload"
                              />
                              <label htmlFor="logo-upload" className="btn btn-outline-primary btn-sm">
                                <TbUpload className="me-1" />
                                Subir logo
                              </label>
                              {logoFile && (
                                <p className="text-success small mt-2 mb-0">
                                  Archivo seleccionado: {logoFile.name}
                                </p>
                              )}
                              <p className="text-muted small mt-2 mb-0">
                                Tamaño recomendado: 400x400px. Máximo: 5MB
                              </p>
                            </div>
                          </Form.Group>
                        </Col>

                        {/* Portada */}
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-medium">
                              Portada del negocio <span className="text-danger">*</span>
                            </Form.Label>
                            <div className="border rounded p-4 text-center bg-light">
                              {coverUrl ? (
                                <div className="mb-3">
                                  <img 
                                    src={coverUrl} 
                                    alt="Portada" 
                                    style={{ maxWidth: "200px", maxHeight: "150px" }}
                                  />
                                </div>
                              ) : (
                                <div className="mb-3">
                                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <polyline points="21 15 16 10 5 21"/>
                                  </svg>
                                </div>
                              )}
                              <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const file = e.target.files?.[0];
                                  if (file && file.size <= 5 * 1024 * 1024) {
                                    setCoverFile(file);
                                  } else {
                                    toast.error("El archivo debe ser menor a 5MB");
                                  }
                                }}
                                className="d-none"
                                id="cover-upload"
                              />
                              <label htmlFor="cover-upload" className="btn btn-outline-primary btn-sm">
                                <TbUpload className="me-1" />
                                Subir portada
                              </label>
                              {coverFile && (
                                <p className="text-success small mt-2 mb-0">
                                  Archivo seleccionado: {coverFile.name}
                                </p>
                              )}
                              <p className="text-muted small mt-2 mb-0">
                                Tamaño recomendado: 1920x600px. Máximo: 5MB
                              </p>
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="d-flex justify-content-end mt-4">
                        <Button 
                          variant="primary"
                          onClick={saveHeader}
                          disabled={saving || !businessName}
                        >
                          {saving ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                          Guardar cambios
                        </Button>
                      </div>
                    </Form>
                  </div>
                </Tab.Pane>

                {/* Plantillas Tab */}
                <Tab.Pane eventKey="plantillas">
                  <div>
                    <h5 className="mb-4">Selecciona una plantilla</h5>
                    <Row className="g-3">
                      {[
                        { key: 'classic', name: 'Clásica' },
                        { key: 'modern', name: 'Moderna' },
                        { key: 'minimalist', name: 'Minimalista' },
                        { key: 'elegant', name: 'Elegante' }
                      ].map((template) => (
                        <Col key={template.key} xs={12} sm={6} lg={3}>
                          <Card 
                            className={`cursor-pointer hover-shadow ${selectedTemplate === template.key ? 'border-primary' : ''}`}
                            onClick={() => setSelectedTemplate(template.key)}
                            style={{ cursor: 'pointer' }}
                          >
                            <Card.Body className="text-center p-3">
                              <div className="bg-light rounded mb-3" style={{ height: "150px" }}>
                                <div className="d-flex align-items-center justify-content-center h-100">
                                  <span className="text-muted">{template.name}</span>
                                </div>
                              </div>
                              <h6 className="mb-1">{template.name}</h6>
                              {selectedTemplate === template.key && (
                                <span className="badge bg-primary">Seleccionada</span>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                    <div className="d-flex justify-content-end mt-4">
                      <Button 
                        variant="primary"
                        onClick={saveTemplate}
                        disabled={saving}
                      >
                        {saving ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                        Guardar cambios
                      </Button>
                    </div>
                  </div>
                </Tab.Pane>

                {/* Colores Tab */}
                <Tab.Pane eventKey="colores">
                  <div>
                    <h5 className="mb-4">Personaliza los colores</h5>
                    <Row className="g-4">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-medium">
                            Color primario <span className="text-danger">*</span>
                          </Form.Label>
                          <div className="d-flex align-items-center">
                            <Form.Control
                              type="color"
                              value={colors.primary}
                              onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                              className="me-3"
                              style={{ width: "60px", height: "40px" }}
                            />
                            <Form.Control
                              type="text"
                              value={colors.primary}
                              onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                              placeholder="#000000"
                            />
                          </div>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-medium">
                            Color secundario <span className="text-danger">*</span>
                          </Form.Label>
                          <div className="d-flex align-items-center">
                            <Form.Control
                              type="color"
                              value={colors.secondary}
                              onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                              className="me-3"
                              style={{ width: "60px", height: "40px" }}
                            />
                            <Form.Control
                              type="text"
                              value={colors.secondary}
                              onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                              placeholder="#000000"
                            />
                          </div>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-medium">
                            Color de fondo <span className="text-danger">*</span>
                          </Form.Label>
                          <div className="d-flex align-items-center">
                            <Form.Control
                              type="color"
                              value={colors.background}
                              onChange={(e) => setColors({ ...colors, background: e.target.value })}
                              className="me-3"
                              style={{ width: "60px", height: "40px" }}
                            />
                            <Form.Control
                              type="text"
                              value={colors.background}
                              onChange={(e) => setColors({ ...colors, background: e.target.value })}
                              placeholder="#000000"
                            />
                          </div>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-medium">
                            Color de texto <span className="text-danger">*</span>
                          </Form.Label>
                          <div className="d-flex align-items-center">
                            <Form.Control
                              type="color"
                              value={colors.text}
                              onChange={(e) => setColors({ ...colors, text: e.target.value })}
                              className="me-3"
                              style={{ width: "60px", height: "40px" }}
                            />
                            <Form.Control
                              type="text"
                              value={colors.text}
                              onChange={(e) => setColors({ ...colors, text: e.target.value })}
                              placeholder="#000000"
                            />
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="d-flex justify-content-end mt-4">
                      <Button 
                        variant="primary"
                        onClick={saveColors}
                        disabled={saving}
                      >
                        {saving ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                        Guardar cambios
                      </Button>
                    </div>
                  </div>
                </Tab.Pane>

                {/* Tipografías Tab */}
                <Tab.Pane eventKey="tipografias">
                  <div>
                    <h5 className="mb-4">Selecciona las tipografías</h5>
                    <Row className="g-4">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-medium">
                            Fuente para títulos <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select
                            value={typography.titleFont}
                            onChange={(e) => setTypography({ ...typography, titleFont: e.target.value })}
                          >
                            <option value="Inter">Inter</option>
                            <option value="Roboto">Roboto</option>
                            <option value="Open Sans">Open Sans</option>
                            <option value="Montserrat">Montserrat</option>
                            <option value="Poppins">Poppins</option>
                            <option value="Lato">Lato</option>
                          </Form.Select>
                          <div className="mt-2 p-3 bg-light rounded">
                            <h3 className="mb-0" style={{ fontFamily: typography.titleFont, fontSize: typography.titleSize }}>
                              Título de ejemplo
                            </h3>
                          </div>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-medium">
                            Fuente para textos <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select
                            value={typography.textFont}
                            onChange={(e) => setTypography({ ...typography, textFont: e.target.value })}
                          >
                            <option value="Inter">Inter</option>
                            <option value="Roboto">Roboto</option>
                            <option value="Open Sans">Open Sans</option>
                            <option value="Source Sans Pro">Source Sans Pro</option>
                            <option value="Noto Sans">Noto Sans</option>
                            <option value="Work Sans">Work Sans</option>
                          </Form.Select>
                          <div className="mt-2 p-3 bg-light rounded">
                            <p className="mb-0" style={{ fontFamily: typography.textFont, fontSize: typography.normalSize }}>
                              Este es un texto de ejemplo para mostrar cómo se ve la tipografía seleccionada en párrafos normales.
                            </p>
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row className="g-4 mt-3">
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="fw-medium">
                            Tamaños de fuente <span className="text-danger">*</span>
                          </Form.Label>
                          <Row className="g-3">
                            <Col md={4}>
                              <Form.Label className="small text-muted">Título principal</Form.Label>
                              <Form.Range 
                                min="24" 
                                max="48" 
                                value={typography.titleSize}
                                onChange={(e) => setTypography({ ...typography, titleSize: Number(e.target.value) })}
                              />
                              <div className="text-center small text-muted">{typography.titleSize}px</div>
                            </Col>
                            <Col md={4}>
                              <Form.Label className="small text-muted">Subtítulos</Form.Label>
                              <Form.Range 
                                min="18" 
                                max="32" 
                                value={typography.subtitleSize}
                                onChange={(e) => setTypography({ ...typography, subtitleSize: Number(e.target.value) })}
                              />
                              <div className="text-center small text-muted">{typography.subtitleSize}px</div>
                            </Col>
                            <Col md={4}>
                              <Form.Label className="small text-muted">Texto normal</Form.Label>
                              <Form.Range 
                                min="12" 
                                max="20" 
                                value={typography.normalSize}
                                onChange={(e) => setTypography({ ...typography, normalSize: Number(e.target.value) })}
                              />
                              <div className="text-center small text-muted">{typography.normalSize}px</div>
                            </Col>
                          </Row>
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-4">
                      <Button 
                        variant="primary"
                        onClick={saveTypography}
                        disabled={saving}
                      >
                        {saving ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                        Guardar cambios
                      </Button>
                    </div>
                  </div>
                </Tab.Pane>

                {/* Elementos destacados Tab */}
                <Tab.Pane eventKey="elementos">
                  <div>
                    <h5 className="mb-4">Configura elementos destacados</h5>
                    
                    {/* Banner principal */}
                    <div className="mb-4 pb-4 border-bottom">
                      <h6 className="mb-3">Banner principal</h6>
                      <Form.Check 
                        type="switch"
                        id="banner-switch"
                        label="Mostrar banner en la página de inicio"
                        checked={bannerEnabled}
                        onChange={(e) => setBannerEnabled(e.target.checked)}
                        className="mb-3"
                      />
                      {bannerEnabled && (
                        <Row className="g-3">
                          <Col md={8}>
                            <Form.Group>
                              <Form.Label className="small text-muted">Imagen del banner</Form.Label>
                              <div className="border rounded p-3 bg-light">
                                {bannerUrl && (
                                  <div className="mb-2">
                                    <img 
                                      src={bannerUrl} 
                                      alt="Banner" 
                                      style={{ maxWidth: "100%", maxHeight: "150px" }}
                                    />
                                  </div>
                                )}
                                <Form.Control
                                  type="file"
                                  accept="image/*"
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const file = e.target.files?.[0];
                                    if (file && file.size <= 5 * 1024 * 1024) {
                                      setBannerFile(file);
                                    } else {
                                      toast.error("El archivo debe ser menor a 5MB");
                                    }
                                  }}
                                  className="d-none"
                                  id="banner-upload"
                                />
                                <label htmlFor="banner-upload" className="btn btn-outline-primary btn-sm">
                                  <TbUpload className="me-1" />
                                  Subir imagen
                                </label>
                                {bannerFile && (
                                  <p className="text-success small mt-2 mb-0">
                                    Archivo seleccionado: {bannerFile.name}
                                  </p>
                                )}
                                <p className="text-muted small mt-2 mb-0">
                                  Tamaño recomendado: 1920x600px. Máximo: 5MB
                                </p>
                              </div>
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label className="small text-muted">Texto del botón</Form.Label>
                              <Form.Control 
                                type="text" 
                                placeholder="Ver ofertas"
                                value={bannerButtonText}
                                onChange={(e) => setBannerButtonText(e.target.value)}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      )}
                    </div>

                    {/* Carrusel de imágenes */}
                    <div className="mb-4 pb-4 border-bottom">
                      <h6 className="mb-3">Carrusel de imágenes</h6>
                      <Form.Check 
                        type="switch"
                        id="carousel-switch"
                        label="Mostrar carrusel de imágenes"
                        checked={carouselEnabled}
                        onChange={(e) => setCarouselEnabled(e.target.checked)}
                        className="mb-3"
                      />
                      {carouselEnabled && (
                        <div>
                          <Row className="g-3">
                            {carouselImages.map((image, index) => (
                              <Col key={index} xs={6} md={4} lg={2}>
                                <div className="position-relative">
                                  <img 
                                    src={image.url} 
                                    alt={`Imagen ${index + 1}`}
                                    className="img-fluid rounded"
                                    style={{ height: "100px", width: "100%", objectFit: "cover" }}
                                  />
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    className="position-absolute top-0 end-0 m-1"
                                    onClick={() => removeCarouselImage(index)}
                                  >
                                    <TbTrash size={14} />
                                  </Button>
                                </div>
                              </Col>
                            ))}
                            {carouselImages.length < 5 && (
                              <Col xs={6} md={4} lg={2}>
                                <div 
                                  className="border rounded p-3 text-center bg-light d-flex align-items-center justify-content-center"
                                  style={{ height: "100px", cursor: "pointer" }}
                                >
                                  <Form.Control
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      const files = Array.from(e.target.files || []);
                                      const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
                                      const remainingSlots = 5 - carouselImages.length;
                                      const filesToAdd = validFiles.slice(0, remainingSlots);
                                      
                                      if (validFiles.length !== files.length) {
                                        toast.error("Algunos archivos exceden 5MB y no se agregaron");
                                      }
                                      
                                      setCarouselFiles([...carouselFiles, ...filesToAdd]);
                                    }}
                                    className="d-none"
                                    id="carousel-upload"
                                  />
                                  <label htmlFor="carousel-upload" className="cursor-pointer">
                                    <TbPlus size={24} className="text-muted" />
                                  </label>
                                </div>
                              </Col>
                            )}
                          </Row>
                          <p className="text-muted small mt-2">
                            Máximo 5 imágenes. Tamaño recomendado: 800x600px. Máximo: 5MB por imagen
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Delivery Data */}
                    <div className="mb-4 pb-4 border-bottom">
                      <h6 className="mb-3">Opciones de entrega</h6>
                      
                      <Nav variant="pills" className="mb-3">
                        <Nav.Item>
                          <Nav.Link active>Retirar</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link>Delivery</Nav.Link>
                        </Nav.Item>
                      </Nav>

                      {/* Retirar */}
                      <div className="mb-3">
                        <Form.Check 
                          type="switch"
                          id="pickup-switch"
                          label="Habilitar retiro en tienda"
                          checked={pickupEnabled}
                          onChange={(e) => setPickupEnabled(e.target.checked)}
                          className="mb-3"
                        />
                        {pickupEnabled && (
                          <Row className="g-3">
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label className="small text-muted">Tiempo de preparación</Form.Label>
                                <Form.Control 
                                  type="text" 
                                  placeholder="30 minutos"
                                  value={pickupTime}
                                  onChange={(e) => setPickupTime(e.target.value)}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label className="small text-muted">Disponible desde</Form.Label>
                                <Form.Control 
                                  type="time"
                                  value={pickupFrom}
                                  onChange={(e) => setPickupFrom(e.target.value)}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label className="small text-muted">Disponible hasta</Form.Label>
                                <Form.Control 
                                  type="time"
                                  value={pickupTo}
                                  onChange={(e) => setPickupTo(e.target.value)}
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        )}
                      </div>

                      {/* Delivery */}
                      <div>
                        <Form.Check 
                          type="switch"
                          id="delivery-switch"
                          label="Habilitar delivery"
                          checked={deliveryEnabled}
                          onChange={(e) => setDeliveryEnabled(e.target.checked)}
                          className="mb-3"
                        />
                        {deliveryEnabled && (
                          <Row className="g-3">
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label className="small text-muted">Tiempo de entrega</Form.Label>
                                <Form.Control 
                                  type="text" 
                                  placeholder="45 minutos"
                                  value={deliveryTime}
                                  onChange={(e) => setDeliveryTime(e.target.value)}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label className="small text-muted">Disponible desde</Form.Label>
                                <Form.Control 
                                  type="time"
                                  value={deliveryFrom}
                                  onChange={(e) => setDeliveryFrom(e.target.value)}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label className="small text-muted">Disponible hasta</Form.Label>
                                <Form.Control 
                                  type="time"
                                  value={deliveryTo}
                                  onChange={(e) => setDeliveryTo(e.target.value)}
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        )}
                      </div>
                    </div>

                    {/* Productos destacados */}
                    <div className="mb-4 pb-4 border-bottom">
                      <h6 className="mb-3">Productos destacados</h6>
                      <Form.Check 
                        type="switch"
                        id="featured-switch"
                        label="Mostrar productos destacados"
                        checked={featuredProductsEnabled}
                        onChange={(e) => setFeaturedProductsEnabled(e.target.checked)}
                        className="mb-3"
                      />
                      {featuredProductsEnabled && (
                        <Row className="g-3">
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="small text-muted">Título de la sección</Form.Label>
                              <Form.Control 
                                type="text" 
                                value={featuredProductsTitle}
                                onChange={(e) => setFeaturedProductsTitle(e.target.value)}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="small text-muted">Productos a mostrar</Form.Label>
                              <Form.Select
                                value={featuredProductsQuantity}
                                onChange={(e) => setFeaturedProductsQuantity(Number(e.target.value))}
                              >
                                <option value={4}>4</option>
                                <option value={6}>6</option>
                                <option value={8}>8</option>
                                <option value={12}>12</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>
                      )}
                    </div>

                    {/* Promociones */}
                    <div className="mb-4">
                      <h6 className="mb-3">Promociones</h6>
                      <Form.Check 
                        type="switch"
                        id="promo-switch"
                        label="Mostrar sección de promociones"
                        checked={promotionsEnabled}
                        onChange={(e) => setPromotionsEnabled(e.target.checked)}
                        className="mb-3"
                      />
                      {promotionsEnabled && (
                        <Form.Group>
                          <Form.Label className="small text-muted">Número de promociones a mostrar</Form.Label>
                          <Form.Select 
                            style={{ width: "auto" }}
                            value={promotionsQuantity}
                            onChange={(e) => setPromotionsQuantity(Number(e.target.value))}
                          >
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={6}>6</option>
                            <option value={8}>8</option>
                          </Form.Select>
                        </Form.Group>
                      )}
                    </div>

                    <div className="d-flex justify-content-end mt-4">
                      <Button 
                        variant="primary"
                        onClick={saveFeaturedElements}
                        disabled={saving}
                      >
                        {saving ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                        Guardar cambios
                      </Button>
                    </div>
                  </div>
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </div>
        </Card.Body>
      </Card>
    </>
  );
}