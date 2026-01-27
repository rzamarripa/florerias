import React from 'react';
import { Image, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface CarouselImage {
  url: string;
  path: string;
}

interface CarouselSectionProps {
  carouselEnabled: boolean;
  setCarouselEnabled: (value: boolean) => void;
  carouselImages: CarouselImage[];
  carouselFiles: File[];
  setCarouselFiles: (files: File[]) => void;
  removeCarouselImage: (index: number) => void;
}

const CarouselSection: React.FC<CarouselSectionProps> = ({
  carouselEnabled,
  setCarouselEnabled,
  carouselImages,
  carouselFiles,
  setCarouselFiles,
  removeCarouselImage,
}) => {
  return (
    <AccordionItem value="carousel" className="border rounded-lg shadow-sm overflow-hidden">
      <AccordionTrigger className="px-4 py-3 bg-muted/50 hover:no-underline">
        <div className="flex items-center justify-between w-full pr-2">
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-cyan-500" />
            <span className="font-semibold">Carrusel de Imagenes</span>
          </div>
          <Switch
            id="carousel-switch"
            checked={carouselEnabled}
            onCheckedChange={setCarouselEnabled}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-2 bg-background">
        {carouselEnabled ? (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {/* Imagenes existentes */}
              {carouselImages.map((image, index) => (
                <div key={`existing-${index}`} className="relative">
                  <img
                    src={image.url}
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-20 object-cover rounded"
                  />
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => removeCarouselImage(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {/* Archivos pendientes */}
              {carouselFiles.map((file, index) => (
                <div key={`pending-${index}`} className="relative">
                  <div className="w-full h-20 bg-muted/50 rounded flex flex-col items-center justify-center">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate px-1 max-w-full">
                      {file.name}
                    </span>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => {
                      const newFiles = carouselFiles.filter((_, i) => i !== index);
                      setCarouselFiles(newFiles);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            {(carouselImages.length + carouselFiles.length) < 5 && (
              <div className="mt-3 flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const files = Array.from(e.target.files || []);
                    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
                    const remainingSlots = 5 - carouselImages.length - carouselFiles.length;
                    const filesToAdd = validFiles.slice(0, remainingSlots);

                    if (validFiles.length !== files.length) {
                      toast.error("Algunos archivos exceden 5MB");
                    }

                    if (filesToAdd.length > 0) {
                      setCarouselFiles([...carouselFiles, ...filesToAdd]);
                    }

                    if (filesToAdd.length < validFiles.length) {
                      toast.warning(`Solo se agregaron ${filesToAdd.length} imagenes. Maximo 5.`);
                    }
                  }}
                  className="hidden"
                  id="carousel-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('carousel-upload')?.click()}
                  type="button"
                >
                  <Upload className="mr-1 h-3.5 w-3.5" />
                  Agregar imagenes
                </Button>
                <span className="text-sm text-muted-foreground">
                  {5 - carouselImages.length - carouselFiles.length} espacios disponibles
                </span>
              </div>
            )}

            <p className="text-sm text-muted-foreground mt-2">
              Maximo 5 imagenes. Tamano recomendado: 800x600px
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-3">Carrusel deshabilitado</p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

export default CarouselSection;
