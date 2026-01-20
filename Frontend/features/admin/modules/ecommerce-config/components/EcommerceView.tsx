import React, { useState, useEffect } from 'react';
import { TbTruck, TbTag, TbClock, TbMapPin, TbShoppingCart, TbStar, TbArrowRight, TbCheck, TbPhone, TbMail } from 'react-icons/tb';
import type { EcommerceConfigFeaturedElements, EcommerceConfigColors, EcommerceConfigTypography, EcommerceConfigHeader, StockItem } from '../types';

interface EcommerceViewProps {
  header: EcommerceConfigHeader;
  colors: EcommerceConfigColors;
  typography: EcommerceConfigTypography;
  featuredElements: EcommerceConfigFeaturedElements;
  itemsStock?: StockItem[];
}

const EcommerceView: React.FC<EcommerceViewProps> = ({
  header,
  colors,
  typography,
  featuredElements,
  itemsStock = []
}) => {
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Auto-rotate promotions every 5 seconds
  useEffect(() => {
    if (featuredElements?.promotions?.enabled && featuredElements.promotions.items && featuredElements.promotions.items.length > 1) {
      const interval = setInterval(() => {
        setCurrentPromoIndex((prev) => 
          (prev + 1) % featuredElements.promotions.items!.length
        );
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [featuredElements?.promotions]);

  // Simulate scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: typography?.textFont || 'Inter' }}>
      {/* Modern Browser Frame */}
      <div 
        className="flex items-center px-3 py-2" 
        style={{ 
          background: 'linear-gradient(135deg, #1a1c23 0%, #2d3142 100%)',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px'
        }}
      >
        <div className="flex gap-2">
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f57' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#28ca42' }} />
        </div>
        <div className="flex-grow mx-4">
          <div 
            className="px-3 py-1 rounded-full text-center" 
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              fontSize: '11px', 
              color: '#94a3b8',
              backdropFilter: 'blur(10px)'
            }}
          >
            <span style={{ opacity: 0.7 }}>🔒 https://</span>
            <span className="font-medium">{header?.pageTitle?.toLowerCase().replace(/\s+/g, '-') || 'mi-tienda'}.com</span>
          </div>
        </div>
      </div>

      {/* Website Content */}
      <div 
        className="flex-grow overflow-auto relative"
        style={{ 
          backgroundColor: colors?.background || '#ffffff',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px'
        }}
      >
        {/* Modern Navigation Bar */}
        <nav 
          className={`sticky top-0 transition-all ${isScrolled ? 'shadow-lg' : ''}`}
          style={{ 
            backgroundColor: isScrolled ? 'rgba(255,255,255,0.95)' : '#ffffff',
            backdropFilter: isScrolled ? 'blur(10px)' : 'none',
            borderBottom: isScrolled ? 'none' : '1px solid rgba(0,0,0,0.08)',
            transition: 'all 0.3s ease',
            zIndex: 1000
          }}
        >
          <div className="w-full px-4">
            <div className="flex items-center justify-between py-3">
              {/* Logo & Brand */}
              <div className="flex items-center gap-3">
                {header?.logoUrl ? (
                  <img 
                    src={header.logoUrl} 
                    alt="Logo" 
                    className="rounded-md"
                    style={{ 
                      height: '40px', 
                      width: '40px', 
                      objectFit: 'contain',
                      filter: isScrolled ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' : 'none'
                    }}
                  />
                ) : (
                  <div 
                    className="flex items-center justify-center rounded-md"
                    style={{
                      width: '40px',
                      height: '40px',
                      background: `linear-gradient(135deg, ${colors?.primary || '#6366f1'} 0%, ${colors?.secondary || '#8b5cf6'} 100%)`,
                      boxShadow: '0 4px 6px rgba(99, 102, 241, 0.25)'
                    }}
                  >
                    <span className="text-white font-bold" style={{ fontSize: '18px' }}>
                      {header?.pageTitle?.charAt(0) || 'T'}
                    </span>
                  </div>
                )}
                <div>
                  <h5 
                    className="mb-0 font-bold"
                    style={{ 
                      fontFamily: typography?.titleFont || 'Inter',
                      fontSize: '20px',
                      color: colors?.primary || '#6366f1',
                      letterSpacing: '-0.5px'
                    }}
                  >
                    {header?.pageTitle || 'Mi Tienda Online'}
                  </h5>
                  <span style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '0.5px' }}>
                    TIENDA OFICIAL
                  </span>
                </div>
              </div>
              
              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-4">
                {header?.topbar?.map((item, index) => (
                  <a
                    key={index}
                    href={item.link}
                    className="no-underline relative py-2"
                    style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: colors?.text || '#4b5563',
                      transition: 'all 0.3s ease',
                      letterSpacing: '0.3px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = colors?.primary || '#6366f1';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = colors?.text || '#4b5563';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={(e) => e.preventDefault()}
                  >
                    {item.name}
                  </a>
                ))}
              </div>

              {/* Cart & User Actions */}
              <div className="flex items-center gap-3">
                <button 
                  className="bg-gray-100 rounded-full relative p-2"
                  style={{ 
                    width: '40px', 
                    height: '40px',
                    border: '1px solid rgba(0,0,0,0.08)'
                  }}
                >
                  <TbShoppingCart size={18} />
                  <span 
                    className="absolute top-0 left-full -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-full text-xs"
                    style={{ 
                      backgroundColor: colors?.secondary || '#8b5cf6',
                      fontSize: '10px'
                    }}
                  >
                    0
                  </span>
                </button>
                <button 
                  className="rounded-full px-4 py-2"
                  style={{ 
                    backgroundColor: colors?.primary || '#6366f1',
                    color: 'white',
                    fontWeight: '500',
                    fontSize: '14px',
                    boxShadow: `0 4px 14px 0 ${colors?.primary || '#6366f1'}40`
                  }}
                >
                  Ingresar
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section - Modern Style */}
        {featuredElements?.banner?.enabled && (
          <section 
            className="relative overflow-hidden"
            style={{ 
              minHeight: '500px',
              background: featuredElements.banner.imageUrl 
                ? `linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%), url(${featuredElements.banner.imageUrl})`
                : `linear-gradient(135deg, ${colors?.primary || '#6366f1'} 0%, ${colors?.secondary || '#8b5cf6'} 100%)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed'
            }}
          >
            {/* Animated Background Shapes */}
            <div className="absolute w-full h-full" style={{ opacity: 0.1 }}>
              <div 
                className="absolute rounded-full"
                style={{
                  width: '400px',
                  height: '400px',
                  background: 'radial-gradient(circle, white 0%, transparent 70%)',
                  top: '-200px',
                  right: '-200px',
                  animation: 'float 20s ease-in-out infinite'
                }}
              />
              <div 
                className="absolute rounded-full"
                style={{
                  width: '300px',
                  height: '300px',
                  background: 'radial-gradient(circle, white 0%, transparent 70%)',
                  bottom: '-150px',
                  left: '-150px',
                  animation: 'float 15s ease-in-out infinite reverse'
                }}
              />
            </div>

            <div className="container mx-auto relative px-4" style={{ zIndex: 10 }}>
              <div className="grid grid-cols-12 items-center min-h-[50vh] py-5">
                <div className="col-span-12 lg:col-span-7">
                  <div className="py-5">
                    <span 
                      className="inline-block rounded-full px-3 py-2 mb-3 text-sm"
                      style={{ 
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '500',
                        letterSpacing: '0.5px'
                      }}
                    >
                      🔥 OFERTAS EXCLUSIVAS
                    </span>
                    <h1 
                      className="text-6xl font-bold text-white mb-4"
                      style={{ 
                        fontFamily: typography?.titleFont || 'Inter',
                        lineHeight: '1.1',
                        letterSpacing: '-2px',
                        textShadow: '0 4px 6px rgba(0,0,0,0.3)'
                      }}
                    >
                      {featuredElements.banner.title || 'Descubre lo Mejor'}
                    </h1>
                    <p 
                      className="text-xl text-white mb-5"
                      style={{ 
                        fontFamily: typography?.textFont || 'Inter',
                        fontSize: '20px',
                        opacity: 0.95,
                        lineHeight: '1.6',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      {featuredElements.banner.text || 'Productos de alta calidad con los mejores precios del mercado'}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {featuredElements.banner.button && (
                        <button
                          className="text-white relative overflow-hidden text-lg"
                          style={{
                            backgroundColor: colors?.primary || '#6366f1',
                            padding: '14px 32px',
                            fontWeight: '600',
                            fontSize: '16px',
                            borderRadius: '50px',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';
                          }}
                        >
                          {featuredElements.banner.button.name || 'Comprar Ahora'}
                          <TbArrowRight className="ml-2" size={20} />
                        </button>
                      )}
                      <button
                        className="text-white border-2 border-white text-lg"
                        style={{
                          padding: '14px 32px',
                          fontWeight: '600',
                          fontSize: '16px',
                          borderRadius: '50px',
                          borderWidth: '2px',
                          backdropFilter: 'blur(10px)',
                          backgroundColor: 'rgba(255,255,255,0.1)'
                        }}
                      >
                        Ver Catálogo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Features Section - Delivery Info */}
        {(featuredElements?.delivery?.pickup?.enabled || featuredElements?.delivery?.delivery?.enabled) && (
          <section className="py-5 bg-gray-100">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-12 gap-4">
                {featuredElements.delivery.pickup?.enabled && (
                  <div className="col-md-6">
                    <div 
                      className="card h-100 shadow-sm hover-shadow-lg"
                      style={{ 
                        borderRadius: '16px',
                        transition: 'all 0.3s ease',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                      }}
                    >
                      <div className="card-body p-4">
                        <div className="d-flex align-items-start gap-3">
                          <div 
                            className="p-3 rounded-3"
                            style={{ 
                              background: `linear-gradient(135deg, ${colors?.primary || '#6366f1'}20 0%, ${colors?.primary || '#6366f1'}10 100%)`,
                            }}
                          >
                            <TbMapPin size={28} style={{ color: colors?.primary || '#6366f1' }} />
                          </div>
                          <div className="flex-grow-1">
                            <h5 
                              className="fw-bold mb-2"
                              style={{ 
                                color: colors?.primary || '#6366f1',
                                fontFamily: typography?.titleFont || 'Inter'
                              }}
                            >
                              Retiro en Tienda
                            </h5>
                            <p className="text-muted mb-3">
                              Recoge tu pedido sin costo adicional
                            </p>
                            <div className="d-flex flex-column gap-2">
                              <div className="d-flex align-items-center gap-2">
                                <TbCheck size={16} style={{ color: '#10b981' }} />
                                <small className="text-muted">Sin costo de envío</small>
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <TbClock size={16} style={{ color: colors?.secondary || '#8b5cf6' }} />
                                <small className="fw-medium">
                                  Listo en {featuredElements.delivery.pickup.time || '30 minutos'}
                                </small>
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <small className="text-muted">
                                  Horario: {featuredElements.delivery.pickup.availableFrom} - {featuredElements.delivery.pickup.availableTo}
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {featuredElements?.delivery?.delivery?.enabled && (
                  <div className="col-md-6">
                    <div 
                      className="card h-100 shadow-sm hover-shadow-lg"
                      style={{ 
                        borderRadius: '16px',
                        transition: 'all 0.3s ease',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                      }}
                    >
                      <div className="card-body p-4">
                        <div className="d-flex align-items-start gap-3">
                          <div 
                            className="p-3 rounded-3"
                            style={{ 
                              background: `linear-gradient(135deg, ${colors?.secondary || '#8b5cf6'}20 0%, ${colors?.secondary || '#8b5cf6'}10 100%)`,
                            }}
                          >
                            <TbTruck size={28} style={{ color: colors?.secondary || '#8b5cf6' }} />
                          </div>
                          <div className="flex-grow-1">
                            <h5 
                              className="fw-bold mb-2"
                              style={{ 
                                color: colors?.secondary || '#8b5cf6',
                                fontFamily: typography?.titleFont || 'Inter'
                              }}
                            >
                              Envío a Domicilio
                            </h5>
                            <p className="text-muted mb-3">
                              Te lo llevamos hasta tu puerta
                            </p>
                            <div className="d-flex flex-column gap-2">
                              <div className="d-flex align-items-center gap-2">
                                <TbCheck size={16} style={{ color: '#10b981' }} />
                                <small className="text-muted">Envío express disponible</small>
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <TbClock size={16} style={{ color: colors?.primary || '#6366f1' }} />
                                <small className="fw-medium">
                                  Entrega en {featuredElements.delivery.delivery.time || '45 minutos'}
                                </small>
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <small className="text-muted">
                                  Horario: {featuredElements.delivery.delivery.availableFrom} - {featuredElements.delivery.delivery.availableTo}
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Promotions Section - Modern Carousel */}
        {featuredElements?.promotions?.enabled && featuredElements.promotions.items && featuredElements.promotions.items.length > 0 && (
          <section className="py-5">
            <div className="container">
              <div className="text-center mb-5">
                <span 
                  className="badge rounded-pill px-3 py-2 mb-3"
                  style={{ 
                    backgroundColor: `${colors?.secondary || '#8b5cf6'}20`,
                    color: colors?.secondary || '#8b5cf6',
                    fontSize: '12px',
                    fontWeight: '600',
                    letterSpacing: '0.5px'
                  }}
                >
                  OFERTAS LIMITADAS
                </span>
                <h2 
                  className="fw-bold mb-3"
                  style={{ 
                    fontFamily: typography?.titleFont || 'Inter',
                    fontSize: '36px',
                    color: colors?.primary || '#6366f1',
                    letterSpacing: '-1px'
                  }}
                >
                  Promociones Especiales
                </h2>
                <p className="text-muted">Aprovecha nuestras ofertas exclusivas por tiempo limitado</p>
              </div>

              <div 
                className="position-relative overflow-hidden rounded-4"
                style={{ 
                  background: `linear-gradient(135deg, ${colors?.primary || '#6366f1'} 0%, ${colors?.secondary || '#8b5cf6'} 100%)`,
                  minHeight: '200px',
                  boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)'
                }}
              >
                {featuredElements.promotions.items.map((promo, index) => (
                  <div
                    key={index}
                    className={`position-absolute w-100 h-100 d-flex align-items-center justify-content-center text-white p-5`}
                    style={{
                      transition: 'all 0.6s ease',
                      opacity: index === currentPromoIndex ? 1 : 0,
                      transform: index === currentPromoIndex ? 'scale(1)' : 'scale(0.95)',
                      top: 0,
                      left: 0
                    }}
                  >
                    <div className="text-center">
                      <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
                        <div 
                          className="p-2 rounded-circle"
                          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                        >
                          <TbTag size={24} />
                        </div>
                        <h3 
                          className="mb-0 fw-bold"
                          style={{ 
                            fontFamily: typography?.titleFont || 'Inter',
                            fontSize: '28px',
                            letterSpacing: '-0.5px'
                          }}
                        >
                          {promo.name}
                        </h3>
                      </div>
                      <p 
                        className="mb-3 fs-5"
                        style={{ 
                          fontFamily: typography?.textFont || 'Inter',
                          opacity: 0.95
                        }}
                      >
                        {promo.text}
                      </p>
                      {promo.expirationDate && (
                        <div 
                          className="badge rounded-pill px-3 py-2"
                          style={{ 
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(10px)',
                            fontSize: '13px'
                          }}
                        >
                          ⏰ Válido hasta: {new Date(promo.expirationDate).toLocaleDateString('es-ES', { 
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Modern Dots Indicator */}
                {featuredElements.promotions.items.length > 1 && (
                  <div className="position-absolute bottom-0 start-50 translate-middle-x mb-4 d-flex gap-2">
                    {featuredElements.promotions.items.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPromoIndex(index)}
                        className="p-0"
                        style={{
                          width: index === currentPromoIndex ? '24px' : '8px',
                          height: '8px',
                          borderRadius: '4px',
                          backgroundColor: index === currentPromoIndex ? 'white' : 'rgba(255,255,255,0.4)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Products Section - Modern Grid */}
        {featuredElements?.productCatalog?.enabled && (
          <section className="py-5 bg-light">
            <div className="container">
              <div className="text-center mb-5">
                <span 
                  className="badge rounded-pill px-3 py-2 mb-3"
                  style={{ 
                    backgroundColor: `${colors?.primary || '#6366f1'}20`,
                    color: colors?.primary || '#6366f1',
                    fontSize: '12px',
                    fontWeight: '600',
                    letterSpacing: '0.5px'
                  }}
                >
                  PRODUCTOS DESTACADOS
                </span>
                <h2 
                  className="fw-bold mb-3"
                  style={{ 
                    fontFamily: typography?.titleFont || 'Inter',
                    fontSize: '36px',
                    color: colors?.primary || '#6366f1',
                    letterSpacing: '-1px'
                  }}
                >
                  Nuestro Catálogo
                </h2>
                <p className="text-muted">Descubre nuestra selección de productos de alta calidad</p>
              </div>
              
              <div className="row g-4">
                {/* Mostrar productos reales si existen, sino mostrar productos de ejemplo */}
                {itemsStock && itemsStock.length > 0 ? (
                  // Productos reales
                  itemsStock.slice(0, featuredElements.productCatalog?.productsPerPage || 12).map((product, index) => (
                    <div key={product._id} className={`col-${featuredElements.productCatalog?.display === 'list' ? '12' : featuredElements.productCatalog?.display === 'cards' ? '6' : 'lg-3 md-6'}`}>
                      <div 
                        className="card h-100 shadow-sm position-relative overflow-hidden"
                        style={{ 
                          borderRadius: '16px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                        }}
                      >
                        {/* Product Badge */}
                        {index === 0 && (
                          <span 
                            className="position-absolute top-0 start-0 badge m-3"
                            style={{ 
                              backgroundColor: colors?.secondary || '#8b5cf6',
                              zIndex: 10,
                              padding: '6px 12px',
                              borderRadius: '8px'
                            }}
                          >
                            Nuevo
                          </span>
                        )}
                        {product.discountPercentage && product.discountPercentage > 0 && (
                          <span 
                            className="position-absolute top-0 end-0 badge m-3"
                            style={{ 
                              backgroundColor: '#ef4444',
                              zIndex: 10,
                              padding: '6px 12px',
                              borderRadius: '8px'
                            }}
                          >
                            -{product.discountPercentage}%
                          </span>
                        )}
                        
                        {/* Product Image */}
                        <div 
                          className="position-relative overflow-hidden"
                          style={{ height: '220px' }}
                        >
                          {product.imagen ? (
                            <img 
                              src={product.imagen} 
                              alt={product.nombre}
                              className="w-100 h-100"
                              style={{ 
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <div 
                              className="w-100 h-100 d-flex align-items-center justify-content-center"
                              style={{ 
                                background: `linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)`
                              }}
                            >
                              <TbShoppingCart size={48} className="text-muted opacity-50" />
                            </div>
                          )}
                          <div 
                            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center opacity-0"
                            style={{ 
                              backgroundColor: 'rgba(0,0,0,0.7)',
                              transition: 'opacity 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                          >
                            <button 
                              className="btn btn-light rounded-circle p-3"
                              style={{ 
                                boxShadow: '0 4px 20px rgba(255,255,255,0.3)'
                              }}
                            >
                              <TbShoppingCart size={20} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="card-body p-4">
                          {/* Stock Badge */}
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <span 
                              className="badge rounded-pill"
                              style={{
                                backgroundColor: product.stock > 10 ? '#10b98120' : product.stock > 0 ? '#f59e0b20' : '#ef444420',
                                color: product.stock > 10 ? '#10b981' : product.stock > 0 ? '#f59e0b' : '#ef4444',
                                fontSize: '11px',
                                padding: '4px 8px'
                              }}
                            >
                              {product.stock > 10 ? `En stock: ${product.stock}` : product.stock > 0 ? `Últimos ${product.stock}` : 'Agotado'}
                            </span>
                          </div>
                          
                          <h5 
                            className="fw-bold mb-2"
                            style={{
                              fontFamily: typography?.titleFont || 'Inter',
                              color: colors?.text || '#1f2937',
                              fontSize: '18px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {product.nombre}
                          </h5>
                          
                          <p 
                            className="text-muted small mb-3"
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: '1.5'
                            }}
                          >
                            {product.descripcion || 'Sin descripción disponible'}
                          </p>
                          
                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              {product.originalPrice && product.originalPrice > product.precio && (
                                <span className="text-muted small text-decoration-line-through d-block">
                                  ${product.originalPrice.toFixed(2)}
                                </span>
                              )}
                              <h5 
                                className="fw-bold mb-0"
                                style={{ 
                                  color: colors?.primary || '#6366f1',
                                  fontSize: '22px'
                                }}
                              >
                                ${product.precio.toFixed(2)}
                              </h5>
                            </div>
                            <button
                              className="btn rounded-pill"
                              disabled={product.stock === 0}
                              style={{
                                backgroundColor: product.stock > 0 ? (colors?.primary || '#6366f1') : '#9ca3af',
                                color: 'white',
                                padding: '8px 20px',
                                fontSize: '14px',
                                fontWeight: '600',
                                boxShadow: product.stock > 0 ? `0 4px 14px 0 ${colors?.primary || '#6366f1'}40` : 'none',
                                cursor: product.stock > 0 ? 'pointer' : 'not-allowed'
                              }}
                            >
                              {product.stock > 0 ? 'Agregar' : 'Agotado'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Productos de ejemplo cuando no hay productos reales
                  [1, 2, 3, 4].map((num) => (
                    <div key={num} className={`col-${featuredElements.productCatalog?.display === 'list' ? '12' : featuredElements.productCatalog?.display === 'cards' ? '6' : 'lg-3 md-6'}`}>
                      <div 
                        className="card h-100 shadow-sm position-relative overflow-hidden"
                        style={{ 
                          borderRadius: '16px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                        }}
                      >
                        {num === 1 && (
                          <span 
                            className="position-absolute top-0 start-0 badge m-3"
                            style={{ 
                              backgroundColor: colors?.secondary || '#8b5cf6',
                              zIndex: 10,
                              padding: '6px 12px',
                              borderRadius: '8px'
                            }}
                          >
                            Nuevo
                          </span>
                        )}
                        
                        <div 
                          className="position-relative overflow-hidden"
                          style={{ height: '220px' }}
                        >
                          <div 
                            className="w-100 h-100"
                            style={{ 
                              background: `linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)`
                            }}
                          />
                          <div 
                            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center opacity-0"
                            style={{ 
                              backgroundColor: 'rgba(0,0,0,0.7)',
                              transition: 'opacity 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                          >
                            <button 
                              className="btn btn-light rounded-circle p-3"
                              style={{ 
                                boxShadow: '0 4px 20px rgba(255,255,255,0.3)'
                              }}
                            >
                              <TbShoppingCart size={20} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="card-body p-4">
                          <div className="d-flex gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <TbStar 
                                key={i} 
                                size={14} 
                                fill={i < 4 ? '#fbbf24' : 'none'}
                                style={{ color: '#fbbf24' }}
                              />
                            ))}
                            <small className="text-muted ms-2">(4.5)</small>
                          </div>
                          
                          <h5 
                            className="fw-bold mb-2"
                            style={{
                              fontFamily: typography?.titleFont || 'Inter',
                              color: colors?.text || '#1f2937',
                              fontSize: '18px'
                            }}
                          >
                            Producto Premium {num}
                          </h5>
                          
                          <p className="text-muted small mb-3">
                            Descripción breve del producto con sus características principales
                          </p>
                          
                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              <span className="text-muted small text-decoration-line-through">
                                ${399 * num}
                              </span>
                              <h5 
                                className="fw-bold mb-0"
                                style={{ 
                                  color: colors?.primary || '#6366f1',
                                  fontSize: '22px'
                                }}
                              >
                                ${299 * num}
                              </h5>
                            </div>
                            <button
                              className="btn rounded-pill"
                              style={{
                                backgroundColor: colors?.primary || '#6366f1',
                                color: 'white',
                                padding: '8px 20px',
                                fontSize: '14px',
                                fontWeight: '600',
                                boxShadow: `0 4px 14px 0 ${colors?.primary || '#6366f1'}40`
                              }}
                            >
                              Agregar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Load More Button */}
              <div className="text-center mt-5">
                <button 
                  className="btn btn-outline-primary rounded-pill px-5 py-3"
                  style={{ 
                    borderWidth: '2px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Ver Más Productos
                  <TbArrowRight className="ms-2" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Modern Footer */}
        <footer 
          className="py-5 mt-5"
          style={{ 
            background: 'linear-gradient(135deg, #1a1c23 0%, #2d3142 100%)',
            color: 'white'
          }}
        >
          <div className="container">
            <div className="row g-4 mb-4">
              <div className="col-lg-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div 
                    className="p-2 rounded-2"
                    style={{ 
                      background: 'linear-gradient(135deg, white 0%, #f3f4f6 100%)'
                    }}
                  >
                    {header?.logoUrl ? (
                      <img 
                        src={header.logoUrl} 
                        alt="Logo" 
                        style={{ height: '30px', width: '30px' }}
                      />
                    ) : (
                      <div 
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '4px',
                          background: `linear-gradient(135deg, ${colors?.primary || '#6366f1'} 0%, ${colors?.secondary || '#8b5cf6'} 100%)`
                        }}
                      />
                    )}
                  </div>
                  <h5 className="mb-0 fw-bold">{header?.pageTitle || 'Mi Tienda'}</h5>
                </div>
                <p className="text-white-50 small">
                  Tu tienda de confianza con los mejores productos y el mejor servicio al cliente.
                </p>
                <div className="d-flex gap-3 mt-3">
                  <div className="d-flex align-items-center gap-2">
                    <TbPhone size={16} />
                    <small>+1 234 567 890</small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <TbMail size={16} />
                    <small>info@tienda.com</small>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-8">
                <div className="row g-4">
                  <div className="col-md-4">
                    <h6 className="fw-bold mb-3">Enlaces Rápidos</h6>
                    <ul className="list-unstyled">
                      {header?.topbar?.slice(0, 4).map((item, index) => (
                        <li key={index} className="mb-2">
                          <a 
                            href={item.link}
                            className="text-white-50 text-decoration-none small"
                            onClick={(e) => e.preventDefault()}
                          >
                            {item.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="col-md-4">
                    <h6 className="fw-bold mb-3">Servicio al Cliente</h6>
                    <ul className="list-unstyled">
                      <li className="mb-2"><small className="text-white-50">Centro de Ayuda</small></li>
                      <li className="mb-2"><small className="text-white-50">Política de Devolución</small></li>
                      <li className="mb-2"><small className="text-white-50">Envíos</small></li>
                      <li className="mb-2"><small className="text-white-50">Términos y Condiciones</small></li>
                    </ul>
                  </div>
                  <div className="col-md-4">
                    <h6 className="fw-bold mb-3">Newsletter</h6>
                    <p className="text-white-50 small mb-3">Suscríbete para recibir ofertas exclusivas</p>
                    <div className="input-group">
                      <input 
                        type="email" 
                        className="form-control" 
                        placeholder="Tu email"
                        style={{ fontSize: '14px' }}
                      />
                      <button 
                        className="btn"
                        style={{ 
                          backgroundColor: colors?.primary || '#6366f1',
                          color: 'white',
                          fontSize: '14px'
                        }}
                      >
                        Suscribir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <hr className="border-white-50" />
            
            <div className="text-center py-3">
              <small className="text-white-50">
                © 2024 {header?.pageTitle || 'Mi Tienda Online'}. Todos los derechos reservados.
              </small>
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .hover-shadow-lg:hover {
          box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
        }
      `}</style>
    </div>
  );
};

export default EcommerceView;