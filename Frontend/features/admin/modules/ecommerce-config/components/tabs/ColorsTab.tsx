import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { EcommerceConfigColors } from '../../types';

interface ColorsTabProps {
  colors: EcommerceConfigColors;
  setColors: (colors: EcommerceConfigColors) => void;
  saving: boolean;
  onSave: () => void;
}

const ColorsTab: React.FC<ColorsTabProps> = ({
  colors,
  setColors,
  saving,
  onSave,
}) => {
  return (
    <div>
      <h5 className="mb-4 text-lg font-semibold">Personaliza los colores</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-medium">
            Color primario <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={colors.primary}
              onChange={(e) => setColors({ ...colors, primary: e.target.value })}
              className="w-[60px] h-[40px] rounded border cursor-pointer"
            />
            <Input
              type="text"
              value={colors.primary}
              onChange={(e) => setColors({ ...colors, primary: e.target.value })}
              placeholder="#000000"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="font-medium">
            Color secundario <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={colors.secondary}
              onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
              className="w-[60px] h-[40px] rounded border cursor-pointer"
            />
            <Input
              type="text"
              value={colors.secondary}
              onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
              placeholder="#000000"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="font-medium">
            Color de fondo <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={colors.background}
              onChange={(e) => setColors({ ...colors, background: e.target.value })}
              className="w-[60px] h-[40px] rounded border cursor-pointer"
            />
            <Input
              type="text"
              value={colors.background}
              onChange={(e) => setColors({ ...colors, background: e.target.value })}
              placeholder="#000000"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="font-medium">
            Color de texto <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={colors.text}
              onChange={(e) => setColors({ ...colors, text: e.target.value })}
              className="w-[60px] h-[40px] rounded border cursor-pointer"
            />
            <Input
              type="text"
              value={colors.text}
              onChange={(e) => setColors({ ...colors, text: e.target.value })}
              placeholder="#000000"
            />
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

export default ColorsTab;
