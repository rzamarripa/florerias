import React from 'react';
import { Loader2, Upload, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TopbarItem } from '../../types';

interface HeaderTabProps {
  pageTitle: string;
  setPageTitle: (value: string) => void;
  logoUrl: string;
  logoFile: File | null;
  setLogoFile: (file: File | null) => void;
  topbarItems: TopbarItem[];
  setTopbarItems: (items: TopbarItem[]) => void;
  saving: boolean;
  onSave: () => void;
}

const HeaderTab: React.FC<HeaderTabProps> = ({
  pageTitle,
  setPageTitle,
  logoUrl,
  logoFile,
  setLogoFile,
  topbarItems,
  setTopbarItems,
  saving,
  onSave,
}) => {
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

  return (
    <div>
      <h5 className="mb-4 text-lg font-semibold">Configuracion del encabezado</h5>
      <div>
        {/* Titulo de pagina */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="space-y-2">
            <Label className="font-medium">
              Titulo de la pagina <span className="text-destructive">*</span>
            </Label>
            <Input
              type="text"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              placeholder="Ej: Mi tienda online"
              maxLength={100}
            />
            <p className="text-sm text-muted-foreground">
              {pageTitle.length}/100 caracteres
            </p>
          </div>

          {/* Logo */}
          <div className="space-y-2">
            <Label className="font-medium">
              Logo del negocio <span className="text-destructive">*</span>
            </Label>
            <div className="border rounded-lg p-3 text-center bg-muted/50">
              {logoUrl ? (
                <div className="mb-2">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="max-w-[150px] max-h-[100px] mx-auto"
                  />
                </div>
              ) : (
                <div className="mb-2 flex justify-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
              )}
              <Input
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
                className="hidden"
                id="logo-upload"
              />
              <label htmlFor="logo-upload">
                <Button variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <Upload className="mr-1 h-4 w-4" />
                    Subir logo
                  </span>
                </Button>
              </label>
              {logoFile && (
                <p className="text-sm text-green-600 mt-2">
                  Archivo seleccionado: {logoFile.name}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Tamano recomendado: 400x400px. Maximo: 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Topbar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <Label className="font-medium">
              Menu de navegacion (Topbar)
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addTopbarItem}
              disabled={topbarItems.length >= 6}
            >
              <Plus className="mr-1 h-4 w-4" />
              Agregar opcion
            </Button>
          </div>

          {topbarItems.length === 0 ? (
            <div className="text-center py-4 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">
                No hay opciones en el menu. Haz clic en "Agregar opcion" para crear una.
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-3 space-y-2">
              {topbarItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <Input
                      type="text"
                      placeholder="Nombre del enlace"
                      value={item.name}
                      onChange={(e) => updateTopbarItem(index, 'name', e.target.value)}
                      maxLength={50}
                    />
                  </div>
                  <div className="col-span-6">
                    <Input
                      type="text"
                      placeholder="URL (ej: /productos)"
                      value={item.link}
                      onChange={(e) => updateTopbarItem(index, 'link', e.target.value)}
                      maxLength={200}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => removeTopbarItem(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {topbarItems.length >= 6 && (
                <p className="text-sm text-yellow-600 mt-2">
                  Maximo 6 opciones en el menu
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button
            onClick={onSave}
            disabled={saving || !pageTitle}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeaderTab;
