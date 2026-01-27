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
  const [currentBannerSlide, setCurrentBannerSlide] = useState(0);

  // Auto-rotate promotions
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

  // Auto-rotate banner images
  useEffect(() => {
    if (featuredElements?.banner?.enabled && featuredElements.banner.images && featuredElements.banner.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerSlide((prev) => 
          (prev + 1) % featuredElements.banner.images!.length
        );
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [featuredElements?.banner]);

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: typography?.textFont || 'Inter' }}>
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-3">
              {header?.logoUrl ? (
                <img 
                  src={header.logoUrl} 
                  alt="Logo" 
                  className="h-10 w-10 object-contain rounded-lg"
                />
              ) : (
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: colors?.primary || '#6366f1' }}
                >
                  {header?.pageTitle?.charAt(0) || 'T'}
                </div>
              )}
              <div>
                <h1 
                  className="text-xl font-bold"
                  style={{ 
                    fontFamily: typography?.titleFont || 'Inter',
                    color: colors?.primary || '#6366f1'
                  }}
                >
                  {header?.pageTitle || 'Mi Tienda'}
                </h1>
              </div>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              {header?.topbar?.map((item, index) => (
                <a
                  key={index}
                  href={item.link}
                  className="text-gray-700 hover:text-primary transition-colors duration-200 text-sm font-medium"
                  style={{ color: colors?.text || '#4b5563' }}
                  onClick={(e) => e.preventDefault()}
                >
                  {item.name}
                </a>
              ))}
            </div>

            {/* Cart Button */}
            <div className="flex items-center space-x-3">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <TbShoppingCart size={20} />
                <span 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-white text-xs flex items-center justify-center"
                  style={{ backgroundColor: colors?.secondary || '#8b5cf6' }}
                >
                  0
                </span>
              </button>
              <button 
                className="px-4 py-2 rounded-lg text-white font-medium text-sm transition-all hover:shadow-lg"
                style={{ backgroundColor: colors?.primary || '#6366f1' }}
              >
                Ingresar
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Banner Section with Carousel */}
      {featuredElements?.banner?.enabled && (
        <section className="relative h-[500px] overflow-hidden">
          {/* Banner Images Carousel Background */}
          {featuredElements.banner.images && featuredElements.banner.images.length > 0 ? (
            featuredElements.banner.images.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${index === currentBannerSlide ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${image.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
            ))
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${colors?.primary || '#6366f1'} 0%, ${colors?.secondary || '#8b5cf6'} 100%)`
              }}
            />
          )}
          
          {/* Banner Content Overlay */}
          <div className="relative h-full flex items-center justify-center">
            <div className="max-w-4xl mx-auto text-center px-4 z-10">
              <h2 
                className="text-5xl font-bold text-white mb-4 drop-shadow-lg"
                style={{ fontFamily: typography?.titleFont || 'Inter' }}
              >
                {featuredElements.banner.title || 'Bienvenido a Nuestra Tienda'}
              </h2>
              <p className="text-xl text-white mb-8 opacity-95 drop-shadow">
                {featuredElements.banner.text || 'Descubre productos increíbles'}
              </p>
              {featuredElements.banner.button && (
                <button
                  className="px-8 py-3 bg-white rounded-full font-semibold hover:shadow-xl transition-all transform hover:-translate-y-1"
                  style={{ color: colors?.primary || '#6366f1' }}
                >
                  {featuredElements.banner.button.name || 'Ver más'}
                </button>
              )}
            </div>
          </div>
          
          {/* Carousel Indicators */}
          {featuredElements.banner.images && featuredElements.banner.images.length > 1 && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
              {featuredElements.banner.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBannerSlide(index)}
                  className={`h-2 transition-all duration-300 rounded-full ${index === currentBannerSlide ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </section>
      )}


      {/* Delivery Info Section */}
      {(featuredElements?.delivery?.pickup?.enabled || featuredElements?.delivery?.delivery?.enabled) && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-6">
              {featuredElements.delivery.pickup?.enabled && (
                <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${colors?.primary || '#6366f1'}20` }}
                    >
                      <TbMapPin size={24} style={{ color: colors?.primary || '#6366f1' }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2" style={{ color: colors?.text || '#1f2937' }}>
                        Retiro en Tienda
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Recoge tu pedido sin costo adicional
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <TbClock size={16} className="text-gray-400" />
                          <span>Listo en {featuredElements.delivery.pickup.time || '30 minutos'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>Horario: {featuredElements.delivery.pickup.availableFrom} - {featuredElements.delivery.pickup.availableTo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {featuredElements?.delivery?.delivery?.enabled && (
                <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${colors?.secondary || '#8b5cf6'}20` }}
                    >
                      <TbTruck size={24} style={{ color: colors?.secondary || '#8b5cf6' }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2" style={{ color: colors?.text || '#1f2937' }}>
                        Envío a Domicilio
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Te lo llevamos hasta tu puerta
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <TbClock size={16} className="text-gray-400" />
                          <span>Entrega en {featuredElements.delivery.delivery.time || '45 minutos'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>Horario: {featuredElements.delivery.delivery.availableFrom} - {featuredElements.delivery.delivery.availableTo}</span>
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

      {/* Promotions Section */}
      {featuredElements?.promotions?.enabled && featuredElements.promotions.items && featuredElements.promotions.items.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 
                className="text-3xl font-bold mb-2"
                style={{ 
                  fontFamily: typography?.titleFont || 'Inter',
                  color: colors?.text || '#1f2937'
                }}
              >
                Promociones Especiales
              </h2>
            </div>

            <div 
              className="relative h-48 rounded-xl overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${colors?.primary || '#6366f1'} 0%, ${colors?.secondary || '#8b5cf6'} 100%)`
              }}
            >
              {featuredElements.promotions.items.map((promo, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 flex items-center justify-center text-white p-8 transition-opacity duration-500 ${
                    index === currentPromoIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <TbTag size={24} />
                      <h3 className="text-2xl font-bold">
                        {promo.name}
                      </h3>
                    </div>
                    <p className="text-lg opacity-95">
                      {promo.text}
                    </p>
                    {promo.expirationDate && (
                      <p className="text-sm mt-3 opacity-75">
                        Válido hasta: {new Date(promo.expirationDate).toLocaleDateString('es-ES')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Promotion Indicators */}
              {featuredElements.promotions.items.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {featuredElements.promotions.items.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPromoIndex(index)}
                      className={`h-2 transition-all duration-300 rounded-full ${
                        index === currentPromoIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Products Catalog Section */}
      {featuredElements?.productCatalog?.enabled && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 
                className="text-3xl font-bold mb-2"
                style={{ 
                  fontFamily: typography?.titleFont || 'Inter',
                  color: colors?.text || '#1f2937'
                }}
              >
                Nuestro Catálogo
              </h2>
              <p className="text-gray-600">Descubre nuestra selección de productos</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {itemsStock && itemsStock.length > 0 ? (
                // Real products
                itemsStock.slice(0, 8).map((product) => (
                  <div key={product._id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      {product.imagen ? (
                        <img 
                          src={product.imagen} 
                          alt={product.nombre}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <TbShoppingCart size={48} className="text-gray-300" />
                        </div>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-semibold">Agotado</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-1 truncate">
                        {product.nombre}
                      </h3>
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                        {product.descripcion || 'Sin descripción'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span 
                          className="text-xl font-bold"
                          style={{ color: colors?.primary || '#6366f1' }}
                        >
                          ${product.precio.toFixed(2)}
                        </span>
                        <button
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: colors?.primary || '#6366f1' }}
                          disabled={product.stock === 0}
                        >
                          {product.stock > 0 ? 'Agregar' : 'Agotado'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Example products
                [...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                    <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                      <div className="w-full h-full flex items-center justify-center">
                        <TbShoppingCart size={48} className="text-gray-300" />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        Producto de Ejemplo {i + 1}
                      </h3>
                      <p className="text-gray-500 text-sm mb-3">
                        Descripción del producto con características principales
                      </p>
                      <div className="flex items-center justify-between">
                        <span 
                          className="text-xl font-bold"
                          style={{ color: colors?.primary || '#6366f1' }}
                        >
                          ${(199 + i * 50).toFixed(2)}
                        </span>
                        <button
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-all hover:shadow-md"
                          style={{ backgroundColor: colors?.primary || '#6366f1' }}
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="text-center mt-8">
              <button 
                className="px-6 py-3 rounded-lg border-2 font-medium transition-all hover:shadow-md"
                style={{ 
                  borderColor: colors?.primary || '#6366f1',
                  color: colors?.primary || '#6366f1'
                }}
              >
                Ver Más Productos
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">{header?.pageTitle || 'Mi Tienda'}</h3>
              <p className="text-gray-400 text-sm">
                Tu tienda de confianza con los mejores productos y servicio.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2">
                {header?.topbar?.map((item, index) => (
                  <li key={index}>
                    <a 
                      href={item.link}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <div className="space-y-2 text-gray-400 text-sm">
                <div className="flex items-center space-x-2">
                  <TbPhone size={16} />
                  <span>+1 234 567 890</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TbMail size={16} />
                  <span>info@tienda.com</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-6 text-center text-gray-400 text-sm">
            © 2024 {header?.pageTitle || 'Mi Tienda'}. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EcommerceView;