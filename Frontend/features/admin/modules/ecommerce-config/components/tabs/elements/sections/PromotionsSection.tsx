import React from 'react';
import { Tag, Plus, Trash2, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface PromotionItem {
  name: string;
  text: string;
  expirationDate: string;
  order?: number;
}

interface PromotionsSectionProps {
  promotionsEnabled: boolean;
  setPromotionsEnabled: (value: boolean) => void;
  promotionItems: PromotionItem[];
  setPromotionItems: (promotions: PromotionItem[]) => void;
}

const PromotionsSection: React.FC<PromotionsSectionProps> = ({
  promotionsEnabled,
  setPromotionsEnabled,
  promotionItems,
  setPromotionItems,
}) => {
  const addPromotion = () => {
    if (promotionItems.length < 5) {
      setPromotionItems([
        ...promotionItems,
        {
          name: '',
          text: '',
          expirationDate: '',
          order: promotionItems.length
        }
      ]);
    }
  };

  const removePromotion = (index: number) => {
    setPromotionItems(promotionItems.filter((_, i) => i !== index));
  };

  const updatePromotion = (index: number, field: keyof PromotionItem, value: string) => {
    const updated = [...promotionItems];
    updated[index] = { ...updated[index], [field]: value };
    setPromotionItems(updated);
  };

  return (
    <AccordionItem value="promotions" className="border rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
        <AccordionTrigger className="flex-1 hover:no-underline py-0">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold">Promociones</span>
          </div>
        </AccordionTrigger>
        <Switch
          id="promotions-switch"
          checked={promotionsEnabled}
          onCheckedChange={setPromotionsEnabled}
        />
      </div>
      <AccordionContent className="px-4 pb-4 pt-2 bg-background">
        {promotionsEnabled ? (
          <div className="space-y-4">
            {promotionItems.map((promotion, index) => (
              <div key={index} className="pb-4 border-b last:border-b-0">
                <div className="flex justify-between items-start mb-3">
                  <Badge variant="secondary">Promocion {index + 1}</Badge>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => removePromotion(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nombre de la promocion</Label>
                    <Input
                      type="text"
                      placeholder="2x1 en flores"
                      value={promotion.name}
                      onChange={(e) => updatePromotion(index, 'name', e.target.value)}
                      maxLength={50}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-medium">Descripcion</Label>
                      <Textarea
                        placeholder="Compra una docena y lleva dos docenas"
                        value={promotion.text}
                        onChange={(e) => updatePromotion(index, 'text', e.target.value)}
                        maxLength={200}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Fecha de expiracion
                      </Label>
                      <Input
                        type="date"
                        value={promotion.expirationDate}
                        onChange={(e) => updatePromotion(index, 'expirationDate', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {promotionItems.length < 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addPromotion}
                className="flex items-center"
              >
                <Plus className="mr-1 h-4 w-4" />
                Agregar promocion
              </Button>
            )}

            <p className="text-sm text-muted-foreground">
              Maximo 5 promociones. Las promociones expiradas se ocultaran automaticamente.
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-3">Promociones deshabilitadas</p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

export default PromotionsSection;
