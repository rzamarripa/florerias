import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';
import BannerSection from './sections/BannerSection';
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
  bannerFiles: File[];
  setBannerFiles: (files: File[]) => void;
  saving: boolean;
  onSave: () => void;
}

const FeaturedElementsTab: React.FC<FeaturedElementsTabProps> = ({
  featuredElements,
  setFeaturedElements,
  bannerFiles,
  setBannerFiles,
  saving,
  onSave,
}) => {
  const removeBannerImage = (index: number) => {
    const updatedImages = featuredElements.banner?.images?.filter((_, i) => i !== index) || [];
    setFeaturedElements({
      ...featuredElements,
      banner: {
        ...featuredElements.banner!,
        images: updatedImages
      }
    });
  };

  return (
    <div>
      <h5 className="mb-4 text-lg font-semibold">Configura los elementos destacados de tu tienda</h5>
      
      <Accordion type="multiple" defaultValue={["banner", "delivery"]} className="space-y-3">
        <BannerSection
          bannerEnabled={featuredElements.banner?.enabled || false}
          setBannerEnabled={(value) => setFeaturedElements({
            ...featuredElements,
            banner: { ...featuredElements.banner!, enabled: value }
          })}
          bannerTitle={featuredElements.banner?.title || ''}
          setBannerTitle={(value) => setFeaturedElements({
            ...featuredElements,
            banner: { ...featuredElements.banner!, title: value }
          })}
          bannerText={featuredElements.banner?.text || ''}
          setBannerText={(value) => setFeaturedElements({
            ...featuredElements,
            banner: { ...featuredElements.banner!, text: value }
          })}
          bannerImages={featuredElements.banner?.images || []}
          setBannerImages={(images) => setFeaturedElements({
            ...featuredElements,
            banner: { ...featuredElements.banner!, images }
          })}
          bannerFiles={bannerFiles}
          setBannerFiles={setBannerFiles}
          bannerButtonName={featuredElements.banner?.button?.name || 'Ver más'}
          setBannerButtonName={(value) => setFeaturedElements({
            ...featuredElements,
            banner: {
              ...featuredElements.banner!,
              button: { ...featuredElements.banner?.button!, name: value }
            }
          })}
          bannerButtonLink={featuredElements.banner?.button?.link || '#'}
          setBannerButtonLink={(value) => setFeaturedElements({
            ...featuredElements,
            banner: {
              ...featuredElements.banner!,
              button: { ...featuredElements.banner?.button!, link: value }
            }
          })}
          onRemoveImage={removeBannerImage}
        />

        <DeliverySection
          delivery={featuredElements.delivery || {
            pickup: {
              enabled: true,
              time: '30 minutos',
              availableFrom: '09:00',
              availableTo: '21:00'
            },
            delivery: {
              enabled: true,
              time: '45 minutos',
              availableFrom: '09:00',
              availableTo: '21:00'
            }
          }}
          setDelivery={(delivery) => setFeaturedElements({
            ...featuredElements,
            delivery
          })}
        />

        <PromotionsSection
          promotionsEnabled={featuredElements.promotions?.enabled || false}
          setPromotionsEnabled={(value) => setFeaturedElements({
            ...featuredElements,
            promotions: { ...featuredElements.promotions!, enabled: value }
          })}
          promotionItems={featuredElements.promotions?.items || []}
          setPromotionItems={(items) => setFeaturedElements({
            ...featuredElements,
            promotions: { ...featuredElements.promotions!, items }
          })}
        />

        <ProductCatalogSection
          catalogEnabled={featuredElements.productCatalog?.enabled || false}
          setCatalogEnabled={(value) => setFeaturedElements({
            ...featuredElements,
            productCatalog: { ...featuredElements.productCatalog!, enabled: value }
          })}
          catalogSettings={{
            display: featuredElements.productCatalog?.display || 'grid',
            productsPerPage: featuredElements.productCatalog?.productsPerPage || 12,
            showFilters: featuredElements.productCatalog?.showFilters !== false,
            showCategories: featuredElements.productCatalog?.showCategories !== false,
            showSearch: featuredElements.productCatalog?.showSearch !== false,
            showSort: featuredElements.productCatalog?.showSort !== false,
          }}
          setCatalogSettings={(settings) => setFeaturedElements({
            ...featuredElements,
            productCatalog: {
              ...featuredElements.productCatalog!,
              ...settings
            }
          })}
        />
      </Accordion>

      <div className="mt-6 flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
};

export default FeaturedElementsTab;