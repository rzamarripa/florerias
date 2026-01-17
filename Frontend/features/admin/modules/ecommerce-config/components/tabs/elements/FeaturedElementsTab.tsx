import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';
import BannerSection from './sections/BannerSection';
import CarouselSection from './sections/CarouselSection';
import DeliverySection from './sections/DeliverySection';
import PromotionsSection from './sections/PromotionsSection';
import ProductCatalogSection from './sections/ProductCatalogSection';
import type {
  EcommerceConfigFeaturedElements,
  PromotionItem,
} from '../../../types';

interface FeaturedElementsTabProps {
  featuredElements: EcommerceConfigFeaturedElements;
  setFeaturedElements: (elements: EcommerceConfigFeaturedElements) => void;
  carouselFiles: File[];
  setCarouselFiles: (files: File[]) => void;
  bannerFile: File | null;
  setBannerFile: (file: File | null) => void;
  saving: boolean;
  onSave: () => void;
}

const FeaturedElementsTab: React.FC<FeaturedElementsTabProps> = ({
  featuredElements,
  setFeaturedElements,
  carouselFiles,
  setCarouselFiles,
  bannerFile,
  setBannerFile,
  saving,
  onSave,
}) => {
  const removeCarouselImage = (index: number) => {
    const updatedImages = featuredElements.carousel.images.filter((_, i) => i !== index);
    setFeaturedElements({
      ...featuredElements,
      carousel: {
        ...featuredElements.carousel,
        images: updatedImages
      }
    });
  };

  return (
    <div>
      <h5 className="mb-4 text-lg font-semibold">Configura los elementos destacados de tu tienda</h5>

      <Accordion type="single" collapsible defaultValue="banner" className="mb-4 space-y-3">
        <BannerSection
          bannerEnabled={featuredElements.banner.enabled}
          setBannerEnabled={(enabled) => setFeaturedElements({
            ...featuredElements,
            banner: { ...featuredElements.banner, enabled }
          })}
          bannerTitle={featuredElements.banner.title || ''}
          setBannerTitle={(title) => setFeaturedElements({
            ...featuredElements,
            banner: { ...featuredElements.banner, title }
          })}
          bannerText={featuredElements.banner.text || ''}
          setBannerText={(text) => setFeaturedElements({
            ...featuredElements,
            banner: { ...featuredElements.banner, text }
          })}
          bannerUrl={featuredElements.banner.imageUrl || ''}
          bannerFile={bannerFile}
          setBannerFile={setBannerFile}
          bannerButtonName={featuredElements.banner.button?.name || ''}
          setBannerButtonName={(name) => setFeaturedElements({
            ...featuredElements,
            banner: {
              ...featuredElements.banner,
              button: {
                ...featuredElements.banner.button,
                name,
                link: featuredElements.banner.button?.link || ''
              }
            }
          })}
          bannerButtonLink={featuredElements.banner.button?.link || ''}
          setBannerButtonLink={(link) => setFeaturedElements({
            ...featuredElements,
            banner: {
              ...featuredElements.banner,
              button: {
                name: featuredElements.banner.button?.name || '',
                link
              }
            }
          })}
        />

        <CarouselSection
          carouselEnabled={featuredElements.carousel.enabled}
          setCarouselEnabled={(enabled) => setFeaturedElements({
            ...featuredElements,
            carousel: { ...featuredElements.carousel, enabled }
          })}
          carouselImages={featuredElements.carousel.images}
          carouselFiles={carouselFiles}
          setCarouselFiles={setCarouselFiles}
          removeCarouselImage={removeCarouselImage}
        />

        <DeliverySection
          pickupEnabled={featuredElements.delivery.pickup.enabled}
          setPickupEnabled={(enabled) => setFeaturedElements({
            ...featuredElements,
            delivery: {
              ...featuredElements.delivery,
              pickup: { ...featuredElements.delivery.pickup, enabled }
            }
          })}
          pickupTime={featuredElements.delivery.pickup.time}
          setPickupTime={(time) => setFeaturedElements({
            ...featuredElements,
            delivery: {
              ...featuredElements.delivery,
              pickup: { ...featuredElements.delivery.pickup, time }
            }
          })}
          pickupFrom={featuredElements.delivery.pickup.availableFrom}
          setPickupFrom={(availableFrom) => setFeaturedElements({
            ...featuredElements,
            delivery: {
              ...featuredElements.delivery,
              pickup: { ...featuredElements.delivery.pickup, availableFrom }
            }
          })}
          pickupTo={featuredElements.delivery.pickup.availableTo}
          setPickupTo={(availableTo) => setFeaturedElements({
            ...featuredElements,
            delivery: {
              ...featuredElements.delivery,
              pickup: { ...featuredElements.delivery.pickup, availableTo }
            }
          })}
          deliveryEnabled={featuredElements.delivery.delivery.enabled}
          setDeliveryEnabled={(enabled) => setFeaturedElements({
            ...featuredElements,
            delivery: {
              ...featuredElements.delivery,
              delivery: { ...featuredElements.delivery.delivery, enabled }
            }
          })}
          deliveryTime={featuredElements.delivery.delivery.time}
          setDeliveryTime={(time) => setFeaturedElements({
            ...featuredElements,
            delivery: {
              ...featuredElements.delivery,
              delivery: { ...featuredElements.delivery.delivery, time }
            }
          })}
          deliveryFrom={featuredElements.delivery.delivery.availableFrom}
          setDeliveryFrom={(availableFrom) => setFeaturedElements({
            ...featuredElements,
            delivery: {
              ...featuredElements.delivery,
              delivery: { ...featuredElements.delivery.delivery, availableFrom }
            }
          })}
          deliveryTo={featuredElements.delivery.delivery.availableTo}
          setDeliveryTo={(availableTo) => setFeaturedElements({
            ...featuredElements,
            delivery: {
              ...featuredElements.delivery,
              delivery: { ...featuredElements.delivery.delivery, availableTo }
            }
          })}
        />

        <PromotionsSection
          promotionsEnabled={featuredElements.promotions.enabled}
          setPromotionsEnabled={(enabled) => setFeaturedElements({
            ...featuredElements,
            promotions: { ...featuredElements.promotions, enabled }
          })}
          promotions={featuredElements.promotions.items}
          setPromotions={(items: PromotionItem[]) => setFeaturedElements({
            ...featuredElements,
            promotions: { ...featuredElements.promotions, items }
          })}
        />

        <ProductCatalogSection
          catalogEnabled={featuredElements.productCatalog.enabled}
          setCatalogEnabled={(enabled) => setFeaturedElements({
            ...featuredElements,
            productCatalog: { ...featuredElements.productCatalog, enabled }
          })}
          catalogDisplay={featuredElements.productCatalog.display}
          setCatalogDisplay={(display) => setFeaturedElements({
            ...featuredElements,
            productCatalog: { ...featuredElements.productCatalog, display }
          })}
          catalogProductsPerPage={featuredElements.productCatalog.productsPerPage}
          setCatalogProductsPerPage={(productsPerPage) => setFeaturedElements({
            ...featuredElements,
            productCatalog: { ...featuredElements.productCatalog, productsPerPage }
          })}
          catalogShowFilters={featuredElements.productCatalog.showFilters}
          setCatalogShowFilters={(showFilters) => setFeaturedElements({
            ...featuredElements,
            productCatalog: { ...featuredElements.productCatalog, showFilters }
          })}
          catalogShowCategories={featuredElements.productCatalog.showCategories}
          setCatalogShowCategories={(showCategories) => setFeaturedElements({
            ...featuredElements,
            productCatalog: { ...featuredElements.productCatalog, showCategories }
          })}
          catalogShowSearch={featuredElements.productCatalog.showSearch}
          setCatalogShowSearch={(showSearch) => setFeaturedElements({
            ...featuredElements,
            productCatalog: { ...featuredElements.productCatalog, showSearch }
          })}
          catalogShowSort={featuredElements.productCatalog.showSort}
          setCatalogShowSort={(showSort) => setFeaturedElements({
            ...featuredElements,
            productCatalog: { ...featuredElements.productCatalog, showSort }
          })}
        />
      </Accordion>

      <div className="flex justify-end mt-4">
        <Button
          onClick={onSave}
          disabled={saving}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
};

export default FeaturedElementsTab;
