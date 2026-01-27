import React from 'react';
import { Image, Upload, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { CarouselImage } from '../../../../types';

interface BannerSectionProps {
  bannerEnabled: boolean;
  setBannerEnabled: (value: boolean) => void;
  bannerTitle: string;
  setBannerTitle: (value: string) => void;
  bannerText: string;
  setBannerText: (value: string) => void;
  bannerImages: CarouselImage[];
  setBannerImages: (images: CarouselImage[]) => void;
  bannerFiles: File[];
  setBannerFiles: (files: File[]) => void;
  bannerButtonName: string;
  setBannerButtonName: (value: string) => void;
  bannerButtonLink: string;
  setBannerButtonLink: (value: string) => void;
  onRemoveImage: (index: number) => void;
}

const BannerSection: React.FC<BannerSectionProps> = ({
  bannerEnabled,
  setBannerEnabled,
  bannerTitle,
  setBannerTitle,
  bannerText,
  setBannerText,
  bannerImages,
  setBannerImages,
  bannerFiles,
  setBannerFiles,
  bannerButtonName,
  setBannerButtonName,
  bannerButtonLink,
  setBannerButtonLink,
  onRemoveImage,
}) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validFiles: File[] = [];
    const maxImages = 5;
    const currentTotal = bannerImages.length + bannerFiles.length;
    
    for (let i = 0; i < files.length && currentTotal + validFiles.length < maxImages; i++) {
      const file = files[i];
      if (file.size <= 5 * 1024 * 1024) {
        validFiles.push(file);
      } else {
        toast.error(`${file.name} excede el tamaño máximo de 5MB`);
      }
    }

    if (validFiles.length > 0) {
      setBannerFiles([...bannerFiles, ...validFiles]);
      toast.success(`${validFiles.length} imagen(es) agregada(s)`);
    }
    
    if (currentTotal + validFiles.length >= maxImages) {
      toast.info(`Máximo ${maxImages} imágenes permitidas`);
    }
  };

  const removeNewFile = (index: number) => {
    setBannerFiles(bannerFiles.filter((_, i) => i !== index));
  };

  return (
    <AccordionItem value="banner" className="border rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
        <AccordionTrigger className="flex-1 hover:no-underline py-0">
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            <span className="font-semibold">Banner Hero</span>
          </div>
        </AccordionTrigger>
        <Switch
          id="banner-switch"
          checked={bannerEnabled}
          onCheckedChange={setBannerEnabled}
        />
      </div>
      <AccordionContent className="px-4 pb-4 pt-2 bg-background">
        {bannerEnabled ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Título</Label>
                <Input
                  type="text"
                  placeholder="Ofertas especiales"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Descripción</Label>
                <Input
                  type="text"
                  placeholder="Descuentos de hasta 50%"
                  value={bannerText}
                  onChange={(e) => setBannerText(e.target.value)}
                  maxLength={300}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Texto del botón</Label>
                <Input
                  type="text"
                  placeholder="Ver más"
                  value={bannerButtonName}
                  onChange={(e) => setBannerButtonName(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Enlace</Label>
                <Input
                  type="text"
                  placeholder="/productos"
                  value={bannerButtonLink}
                  onChange={(e) => setBannerButtonLink(e.target.value)}
                  maxLength={200}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Imágenes del Banner (máx. 5)</Label>
              <div className="border rounded-lg p-3 bg-muted/50 space-y-3">
                {/* Existing images */}
                {bannerImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {bannerImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={`Banner ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <button
                          onClick={() => onRemoveImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New files preview */}
                {bannerFiles.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {bannerFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-20 object-cover rounded border-2 border-green-500"
                        />
                        <button
                          onClick={() => removeNewFile(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <span className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-xs px-1 truncate">
                          Nueva
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                {bannerImages.length + bannerFiles.length < 5 && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="banner-upload"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('banner-upload')?.click()}
                      type="button"
                    >
                      <Upload className="mr-1 h-3.5 w-3.5" />
                      Agregar imágenes
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {5 - bannerImages.length - bannerFiles.length} espacios disponibles
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-3">Banner deshabilitado</p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

export default BannerSection;