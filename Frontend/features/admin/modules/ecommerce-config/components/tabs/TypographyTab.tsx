import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { EcommerceConfigTypography } from '../../types';

interface TypographyTabProps {
  typography: EcommerceConfigTypography;
  setTypography: (typography: EcommerceConfigTypography) => void;
  saving: boolean;
  onSave: () => void;
}

const TypographyTab: React.FC<TypographyTabProps> = ({
  typography,
  setTypography,
  saving,
  onSave,
}) => {
  return (
    <div>
      <h5 className="mb-4 text-lg font-semibold">Selecciona las tipografias</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-medium">
            Fuente para titulos <span className="text-destructive">*</span>
          </Label>
          <Select
            value={typography.titleFont}
            onValueChange={(value) => setTypography({ ...typography, titleFont: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar fuente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter">Inter</SelectItem>
              <SelectItem value="Roboto">Roboto</SelectItem>
              <SelectItem value="Open Sans">Open Sans</SelectItem>
              <SelectItem value="Montserrat">Montserrat</SelectItem>
              <SelectItem value="Poppins">Poppins</SelectItem>
              <SelectItem value="Lato">Lato</SelectItem>
            </SelectContent>
          </Select>
          <div className="mt-2 p-3 bg-muted rounded-lg">
            <h3 className="mb-0" style={{ fontFamily: typography.titleFont, fontSize: typography.titleSize }}>
              Titulo de ejemplo
            </h3>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="font-medium">
            Fuente para textos <span className="text-destructive">*</span>
          </Label>
          <Select
            value={typography.textFont}
            onValueChange={(value) => setTypography({ ...typography, textFont: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar fuente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter">Inter</SelectItem>
              <SelectItem value="Roboto">Roboto</SelectItem>
              <SelectItem value="Open Sans">Open Sans</SelectItem>
              <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
              <SelectItem value="Noto Sans">Noto Sans</SelectItem>
              <SelectItem value="Work Sans">Work Sans</SelectItem>
            </SelectContent>
          </Select>
          <div className="mt-2 p-3 bg-muted rounded-lg">
            <p className="mb-0" style={{ fontFamily: typography.textFont, fontSize: typography.normalSize }}>
              Este es un texto de ejemplo para mostrar como se ve la tipografia seleccionada en parrafos normales.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Label className="font-medium">
          Tamanos de fuente <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Titulo principal</Label>
            <input
              type="range"
              min="24"
              max="48"
              value={typography.titleSize}
              onChange={(e) => setTypography({ ...typography, titleSize: Number(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="text-center text-sm text-muted-foreground">{typography.titleSize}px</div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Subtitulos</Label>
            <input
              type="range"
              min="18"
              max="32"
              value={typography.subtitleSize}
              onChange={(e) => setTypography({ ...typography, subtitleSize: Number(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="text-center text-sm text-muted-foreground">{typography.subtitleSize}px</div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Texto normal</Label>
            <input
              type="range"
              min="12"
              max="20"
              value={typography.normalSize}
              onChange={(e) => setTypography({ ...typography, normalSize: Number(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="text-center text-sm text-muted-foreground">{typography.normalSize}px</div>
          </div>
        </div>
      </div>

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

export default TypographyTab;
