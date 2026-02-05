import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageCircle, Phone, Globe, Check, X } from 'lucide-react';
import {
  countries,
  getDefaultCountry,
  getLastUsedCountry,
  saveLastUsedCountry,
  formatPhoneWithCountryCode,
  formatPhoneForDisplay,
  detectCountryFromNumber,
  isValidPhoneNumber,
  Country,
} from '@/utils/countryCodes';
import {
  sendTicketViaWhatsApp,
  generateTicketMessage,
} from '@/services/whatsappService';
import { toast } from 'react-toastify';

interface WhatsAppTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  clientName: string;
  clientPhone?: string;
  ticketUrl: string;
  ticketType: 'sale' | 'delivery';
  onSuccess?: () => void;
}

const WhatsAppTicketModal: React.FC<WhatsAppTicketModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  clientName,
  clientPhone = '',
  ticketUrl,
  ticketType,
  onSuccess,
}) => {
  // Estados
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(getDefaultCountry());
  const [rememberCountry, setRememberCountry] = useState(false);
  const [sending, setSending] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [countrySearch, setCountrySearch] = useState('');

  // Filtrar países según búsqueda
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.dialCode.includes(countrySearch)
  );

  // Al abrir el modal
  useEffect(() => {
    if (isOpen) {
      console.log('🎯 WhatsApp Modal - Abriendo modal con datos:', {
        orderNumber,
        clientName,
        clientPhone,
        ticketType,
        ticketUrl: ticketUrl ? ticketUrl.substring(0, 50) + '...' : null
      });
      
      // Limpiar búsqueda
      setCountrySearch('');
      
      // Obtener último país usado o usar el por defecto
      const lastCountry = getLastUsedCountry();
      if (lastCountry) {
        setSelectedCountry(lastCountry);
        setRememberCountry(true);
        console.log('📍 País recordado:', lastCountry.name, lastCountry.dialCode);
      }
      
      // Si hay número de cliente, procesarlo
      if (clientPhone) {
        const cleanPhone = clientPhone.replace(/[^0-9+]/g, '');
        console.log('📱 Procesando número del cliente:', {
          original: clientPhone,
          cleaned: cleanPhone
        });
        
        // Detectar país si el número incluye código
        if (cleanPhone.startsWith('+')) {
          const detected = detectCountryFromNumber(cleanPhone.substring(1));
          if (detected) {
            setSelectedCountry(detected);
            // Extraer solo el número local
            const localNumber = cleanPhone.substring(1 + detected.dialCode.length);
            setPhoneNumber(localNumber);
            console.log('🌍 País detectado:', detected.name, 'Número local:', localNumber);
          } else {
            setPhoneNumber(cleanPhone.replace('+', ''));
          }
        } else {
          // Si no tiene código, asumir número local
          setPhoneNumber(cleanPhone);
          console.log('📞 Número sin código de país:', cleanPhone);
        }
      }
    }
  }, [isOpen, clientPhone]);

  // Validar número cuando cambia
  useEffect(() => {
    if (phoneNumber && selectedCountry) {
      if (!isValidPhoneNumber(phoneNumber, selectedCountry)) {
        setPhoneError('Número de teléfono inválido');
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }
  }, [phoneNumber, selectedCountry]);

  // Manejar envío
  const handleSend = async () => {
    // Validar número
    if (!phoneNumber) {
      setPhoneError('Por favor ingresa un número de teléfono');
      return;
    }

    if (!isValidPhoneNumber(phoneNumber, selectedCountry)) {
      setPhoneError('Número de teléfono inválido para el país seleccionado');
      return;
    }

    setSending(true);
    setPhoneError('');

    try {
      // Formatear número completo con código de país
      const fullPhoneNumber = formatPhoneWithCountryCode(phoneNumber, selectedCountry);
      
      console.log('📤 WhatsApp Modal - Enviando ticket:', {
        phoneNumber,
        selectedCountry: selectedCountry.name,
        dialCode: selectedCountry.dialCode,
        fullPhoneNumber,
        formatoEsperado: selectedCountry.code === 'MX' ? '52 + 10 dígitos (sin el 1)' : 'Estándar E.164',
        ticketUrl: ticketUrl ? ticketUrl.substring(0, 50) + '...' : null,
        orderNumber
      });
      
      // Generar mensaje
      const message = generateTicketMessage(orderNumber, clientName, ticketType);
      
      // Enviar por WhatsApp
      const result = await sendTicketViaWhatsApp({
        phoneNumber: fullPhoneNumber,
        message,
        ticketUrl,
        ticketType,
      });

      console.log('📨 WhatsApp Modal - Resultado:', {
        success: result.success,
        error: result.error,
        details: result.details
      });
      
      if (result.success) {
        // Guardar país si se seleccionó recordar
        if (rememberCountry) {
          saveLastUsedCountry(selectedCountry);
        }

        console.log('✅ WhatsApp Modal - Ticket enviado exitosamente!');
        toast.success('¡Ticket enviado por WhatsApp exitosamente!');
        onSuccess?.();
        onClose();
      } else {
        console.error('❌ WhatsApp Modal - Error al enviar:', {
          error: result.error,
          details: result.details,
          phoneNumber: fullPhoneNumber
        });
        toast.error(result.error || 'Error al enviar el ticket');
      }
    } catch (error: any) {
      console.error('Error enviando ticket:', error);
      toast.error('Error al enviar el ticket por WhatsApp');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Enviar Ticket por WhatsApp
          </DialogTitle>
          <DialogDescription>
            ¿Deseas enviar el ticket de {ticketType === 'sale' ? 'venta' : 'envío'} al
            cliente por WhatsApp?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Información de la orden */}
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Orden:</strong> #{orderNumber}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Cliente:</strong> {clientName}
            </p>
          </div>

          {/* Selector de país */}
          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            <Select
              value={selectedCountry.code}
              onValueChange={(value) => {
                const country = countries.find(c => c.code === value);
                if (country) setSelectedCountry(country);
              }}
            >
              <SelectTrigger id="country">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{selectedCountry.flag}</span>
                    <span>{selectedCountry.name}</span>
                    <span className="text-gray-500">+{selectedCountry.dialCode}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {/* Búsqueda rápida */}
                <div className="p-2">
                  <Input
                    placeholder="Buscar país..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="h-8"
                  />
                </div>
                
                {/* Lista de países */}
                {filteredCountries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{country.flag}</span>
                      <span>{country.name}</span>
                      <span className="text-gray-500">+{country.dialCode}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Número de teléfono */}
          <div className="space-y-2">
            <Label htmlFor="phone">Número de teléfono</Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 rounded-l-md">
                <Globe className="h-4 w-4 mr-1 text-gray-500" />
                <span className="text-sm font-medium">+{selectedCountry.dialCode}</span>
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder={selectedCountry.format?.replace(/#/g, '0') || 'Número de teléfono'}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                className={`flex-1 ${phoneError ? 'border-red-500' : ''}`}
              />
            </div>
            
            {/* Error o vista previa */}
            {phoneError ? (
              <p className="text-sm text-red-500">{phoneError}</p>
            ) : phoneNumber ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <Phone className="inline h-3 w-3 mr-1" />
                Vista previa: {formatPhoneForDisplay(phoneNumber, selectedCountry)}
              </p>
            ) : null}
          </div>

          {/* Recordar país */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberCountry}
              onCheckedChange={(checked) => setRememberCountry(checked as boolean)}
            />
            <Label
              htmlFor="remember"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Recordar este país para próximas órdenes
            </Label>
          </div>

          {/* Nota informativa */}
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <AlertDescription className="text-sm space-y-2">
              <p>El cliente recibirá el ticket como archivo HTML junto con un mensaje de confirmación en WhatsApp.</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Nota:</strong> En modo desarrollo, solo los números autorizados en Meta Business Suite pueden recibir mensajes.
              </p>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={sending}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={sending || !phoneNumber || !!phoneError}
            className="bg-green-600 hover:bg-green-700"
          >
            {sending ? (
              <>
                <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full inline-block" />
                Enviando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Enviar por WhatsApp
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppTicketModal;