import React from 'react';
import { Image, Upload } from 'lucide-react';
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

interface BannerSectionProps {
  bannerEnabled: boolean;
  setBannerEnabled: (value: boolean) => void;
  bannerTitle: string;
  setBannerTitle: (value: string) => void;
  bannerText: string;
  setBannerText: (value: string) => void;
  bannerUrl: string;
  bannerFile: File | null;
  setBannerFile: (file: File | null) => void;
  bannerButtonName: string;
  setBannerButtonName: (value: string) => void;
  bannerButtonLink: string;
  setBannerButtonLink: (value: string) => void;
}

const BannerSection: React.FC<BannerSectionProps> = ({
  bannerEnabled,
  setBannerEnabled,
  bannerTitle,
  setBannerTitle,
  bannerText,
  setBannerText,
  bannerUrl,
  bannerFile,
  setBannerFile,
  bannerButtonName,
  setBannerButtonName,
  bannerButtonLink,
  setBannerButtonLink,
}) => {
  return (
    <AccordionItem value="banner" className="border rounded-lg shadow-sm overflow-hidden">
      <AccordionTrigger className="px-4 py-3 bg-muted/50 hover:no-underline">
        <div className="flex items-center justify-between w-full pr-2">
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            <span className="font-semibold">Banner Principal</span>
          </div>
          <Switch
            id="banner-switch"
            checked={bannerEnabled}
            onCheckedChange={setBannerEnabled}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-2 bg-background">
        {bannerEnabled ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Titulo</Label>
                <Input
                  type="text"
                  placeholder="Ofertas especiales"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Descripcion</Label>
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
                <Label className="text-sm font-medium">Texto del boton</Label>
                <Input
                  type="text"
                  placeholder="Ver mas"
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
              <Label className="text-sm font-medium">Imagen</Label>
              <div className="border rounded-lg p-3 bg-muted/50">
                {bannerUrl && (
                  <img
                    src={bannerUrl}
                    alt="Banner"
                    className="max-w-full max-h-[100px] mb-2 rounded"
                  />
                )}
                <div className="flex items-center gap-2">
                  <Input
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
                    className="hidden"
                    id="banner-upload"
                  />
                  <label htmlFor="banner-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span className="cursor-pointer">
                        <Upload className="mr-1 h-3.5 w-3.5" />
                        Subir imagen
                      </span>
                    </Button>
                  </label>
                  {bannerFile && (
                    <span className="text-sm text-green-600">
                      {bannerFile.name}
                    </span>
                  )}
                </div>
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
