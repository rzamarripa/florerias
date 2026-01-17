import React from 'react';
import { Truck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface DeliverySectionProps {
  pickupEnabled: boolean;
  setPickupEnabled: (value: boolean) => void;
  pickupTime: string;
  setPickupTime: (value: string) => void;
  pickupFrom: string;
  setPickupFrom: (value: string) => void;
  pickupTo: string;
  setPickupTo: (value: string) => void;
  deliveryEnabled: boolean;
  setDeliveryEnabled: (value: boolean) => void;
  deliveryTime: string;
  setDeliveryTime: (value: string) => void;
  deliveryFrom: string;
  setDeliveryFrom: (value: string) => void;
  deliveryTo: string;
  setDeliveryTo: (value: string) => void;
}

const DeliverySection: React.FC<DeliverySectionProps> = ({
  pickupEnabled,
  setPickupEnabled,
  pickupTime,
  setPickupTime,
  pickupFrom,
  setPickupFrom,
  pickupTo,
  setPickupTo,
  deliveryEnabled,
  setDeliveryEnabled,
  deliveryTime,
  setDeliveryTime,
  deliveryFrom,
  setDeliveryFrom,
  deliveryTo,
  setDeliveryTo,
}) => {
  return (
    <AccordionItem value="delivery" className="border rounded-lg shadow-sm overflow-hidden">
      <AccordionTrigger className="px-4 py-3 bg-muted/50 hover:no-underline">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-green-500" />
          <span className="font-semibold">Opciones de Entrega</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-2 bg-background">
        {/* Retirar */}
        <div className="mb-4 pb-4 border-b">
          <div className="flex items-center gap-3 mb-3">
            <Switch
              id="pickup-switch"
              checked={pickupEnabled}
              onCheckedChange={setPickupEnabled}
            />
            <Label htmlFor="pickup-switch" className="cursor-pointer">
              Habilitar retiro en tienda
            </Label>
          </div>
          {pickupEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tiempo de preparacion</Label>
                <Input
                  type="text"
                  placeholder="30 minutos"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Disponible desde</Label>
                <Input
                  type="time"
                  value={pickupFrom}
                  onChange={(e) => setPickupFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Disponible hasta</Label>
                <Input
                  type="time"
                  value={pickupTo}
                  onChange={(e) => setPickupTo(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Delivery */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Switch
              id="delivery-switch"
              checked={deliveryEnabled}
              onCheckedChange={setDeliveryEnabled}
            />
            <Label htmlFor="delivery-switch" className="cursor-pointer">
              Habilitar delivery
            </Label>
          </div>
          {deliveryEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tiempo de entrega</Label>
                <Input
                  type="text"
                  placeholder="45 minutos"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Disponible desde</Label>
                <Input
                  type="time"
                  value={deliveryFrom}
                  onChange={(e) => setDeliveryFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Disponible hasta</Label>
                <Input
                  type="time"
                  value={deliveryTo}
                  onChange={(e) => setDeliveryTo(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default DeliverySection;
