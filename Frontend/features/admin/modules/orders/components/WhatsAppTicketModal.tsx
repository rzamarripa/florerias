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
import { MessageCircle, Phone, Globe, Check, X, Mail } from 'lucide-react';
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
import { sendOrderEmail } from '@/services/emailService';
interface WhatsAppTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  companyName: string;

  // Sale ticket data
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  saleTicketUrl?: string;

  // Delivery ticket data
  deliveryDriverName?: string;
  deliveryDriverPhone?: string;
  deliveryTicketUrl?: string;

  activeWhatsApp?: boolean;
  onSuccess?: () => void;
}

const WhatsAppTicketModal: React.FC<WhatsAppTicketModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  companyName,
  clientName = '',
  clientPhone = '',
  clientEmail = '',
  saleTicketUrl,
  deliveryDriverName = '',
  deliveryDriverPhone = '',
  deliveryTicketUrl,
  activeWhatsApp = false,
  onSuccess,
}) => {

  // Estados
  // Checkboxes para cada ticket
  const [sendToClient, setSendToClient] = useState(false);
  const [sendToDriver, setSendToDriver] = useState(false);
  const [sendEmailToClient, setSendEmailToClient] = useState(false);
  
  // Estados para el cliente
  const [clientPhoneNumber, setClientPhoneNumber] = useState('');
  const [clientSelectedCountry, setClientSelectedCountry] = useState<Country>(getDefaultCountry());
  const [clientPhoneError, setClientPhoneError] = useState('');
  
  // Estados para el repartidor
  const [driverPhoneNumber, setDriverPhoneNumber] = useState('');
  const [driverSelectedCountry, setDriverSelectedCountry] = useState<Country>(getDefaultCountry());
  const [driverPhoneError, setDriverPhoneError] = useState('');
  
  // Estados generales
  const [rememberCountry, setRememberCountry] = useState(false);
  const [sending, setSending] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Debug: Log datos recibidos
  console.log('🔍 WhatsApp Modal - Datos recibidos:', {
    orderNumber,
    clientName,
    deliveryDriverName: deliveryDriverName || 'NO DISPONIBLE',
    saleTicketUrl: !!saleTicketUrl,
    deliveryTicketUrl: !!deliveryTicketUrl
  });

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
        clientEmail,
        saleTicketUrl: saleTicketUrl ? saleTicketUrl.substring(0, 50) + '...' : null,
        deliveryDriverName,
        deliveryDriverPhone,
        deliveryTicketUrl: deliveryTicketUrl ? deliveryTicketUrl.substring(0, 50) + '...' : null
      });
      
      // Limpiar búsqueda
      setCountrySearch('');
      
      // Obtener último país usado o usar el por defecto
      const lastCountry = getLastUsedCountry();
      if (lastCountry) {
        setClientSelectedCountry(lastCountry);
        setDriverSelectedCountry(lastCountry);
        setRememberCountry(true);
        console.log('📍 País recordado:', lastCountry.name, lastCountry.dialCode);
      }
      
      // Activar checkboxes según tickets disponibles
      setSendToClient(activeWhatsApp && !!saleTicketUrl && !!clientPhone);
      setSendToDriver(activeWhatsApp && !!deliveryTicketUrl && !!deliveryDriverPhone);
      setSendEmailToClient(!!clientEmail); // Activar email si el cliente tiene email
      
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
            setClientSelectedCountry(detected);
            // Extraer solo el número local
            const localNumber = cleanPhone.substring(1 + detected.dialCode.length);
            setClientPhoneNumber(localNumber);
            console.log('🌍 País detectado para cliente:', detected.name, 'Número local:', localNumber);
          } else {
            setClientPhoneNumber(cleanPhone.replace('+', ''));
          }
        } else {
          // Si no tiene código, asumir número local
          setClientPhoneNumber(cleanPhone);
          console.log('📞 Número sin código de país (cliente):', cleanPhone);
        }
      }
      
      // Si hay número de repartidor, procesarlo
      if (deliveryDriverPhone) {
        const cleanPhone = deliveryDriverPhone.replace(/[^0-9+]/g, '');
        console.log('📱 Procesando número del repartidor:', {
          original: deliveryDriverPhone,
          cleaned: cleanPhone
        });
        
        // Detectar país si el número incluye código
        if (cleanPhone.startsWith('+')) {
          const detected = detectCountryFromNumber(cleanPhone.substring(1));
          if (detected) {
            setDriverSelectedCountry(detected);
            // Extraer solo el número local
            const localNumber = cleanPhone.substring(1 + detected.dialCode.length);
            setDriverPhoneNumber(localNumber);
            console.log('🌍 País detectado para repartidor:', detected.name, 'Número local:', localNumber);
          } else {
            setDriverPhoneNumber(cleanPhone.replace('+', ''));
          }
        } else {
          // Si no tiene código, asumir número local
          setDriverPhoneNumber(cleanPhone);
          console.log('📞 Número sin código de país (repartidor):', cleanPhone);
        }
      }
    }
  }, [isOpen, clientPhone, deliveryDriverPhone, saleTicketUrl, deliveryTicketUrl]);

  // Validar número del cliente cuando cambia
  useEffect(() => {
    if (clientPhoneNumber && clientSelectedCountry) {
      if (!isValidPhoneNumber(clientPhoneNumber, clientSelectedCountry)) {
        setClientPhoneError('Número de teléfono inválido');
      } else {
        setClientPhoneError('');
      }
    } else {
      setClientPhoneError('');
    }
  }, [clientPhoneNumber, clientSelectedCountry]);
  
  // Validar número del repartidor cuando cambia
  useEffect(() => {
    if (driverPhoneNumber && driverSelectedCountry) {
      if (!isValidPhoneNumber(driverPhoneNumber, driverSelectedCountry)) {
        setDriverPhoneError('Número de teléfono inválido');
      } else {
        setDriverPhoneError('');
      }
    } else {
      setDriverPhoneError('');
    }
  }, [driverPhoneNumber, driverSelectedCountry]);

  // Manejar envío
  const handleSend = async () => {
    // Validar que al menos uno esté seleccionado
    if (!sendToClient && !sendToDriver && !sendEmailToClient) {
      toast.error('Por favor selecciona al menos un método de envío');
      return;
    }

    // Validar números si están seleccionados
    if (sendToClient) {
      if (!clientPhoneNumber) {
        setClientPhoneError('Por favor ingresa el número del cliente');
        return;
      }
      if (!isValidPhoneNumber(clientPhoneNumber, clientSelectedCountry)) {
        setClientPhoneError('Número de teléfono inválido para el país seleccionado');
        return;
      }
    }

    if (sendToDriver) {
      if (!driverPhoneNumber) {
        setDriverPhoneError('Por favor ingresa el número del repartidor');
        return;
      }
      if (!isValidPhoneNumber(driverPhoneNumber, driverSelectedCountry)) {
        setDriverPhoneError('Número de teléfono inválido para el país seleccionado');
        return;
      }
    }

    setSending(true);
    setClientPhoneError('');
    setDriverPhoneError('');

    let successCount = 0;
    let errorCount = 0;

    try {
      // Enviar ticket de venta al cliente si está seleccionado
      if (sendToClient && saleTicketUrl) {
        try {
          const fullPhoneNumber = formatPhoneWithCountryCode(clientPhoneNumber, clientSelectedCountry);
          
          console.log('📤 WhatsApp Modal - Enviando ticket de venta al cliente:', {
            phoneNumber: clientPhoneNumber,
            selectedCountry: clientSelectedCountry.name,
            dialCode: clientSelectedCountry.dialCode,
            fullPhoneNumber,
            ticketUrl: saleTicketUrl ? saleTicketUrl.substring(0, 50) + '...' : null,
            orderNumber
          });
          
          const message = generateTicketMessage(orderNumber, clientName, 'sale', companyName);
          
          const result = await sendTicketViaWhatsApp({
            phoneNumber: fullPhoneNumber,
            message,
            ticketUrl: saleTicketUrl,
            ticketType: 'sale',
          });

          if (result.success) {
            successCount++;
            console.log('✅ Ticket de venta enviado al cliente exitosamente');
          } else {
            errorCount++;
            console.error('❌ Error al enviar ticket de venta al cliente:', result.error);
          }
        } catch (error: any) {
          errorCount++;
          console.error('Error enviando ticket al cliente:', error);
        }
      }

      // Enviar ticket de envío al repartidor si está seleccionado
      if (sendToDriver && deliveryTicketUrl) {
        try {
          const fullPhoneNumber = formatPhoneWithCountryCode(driverPhoneNumber, driverSelectedCountry);
          
          console.log('📤 WhatsApp Modal - Enviando ticket de envío al repartidor:', {
            phoneNumber: driverPhoneNumber,
            selectedCountry: driverSelectedCountry.name,
            dialCode: driverSelectedCountry.dialCode,
            fullPhoneNumber,
            ticketUrl: deliveryTicketUrl ? deliveryTicketUrl.substring(0, 50) + '...' : null,
            orderNumber,
            deliveryDriverName: deliveryDriverName || 'NOMBRE NO DISPONIBLE'
          });
          
          const message = generateTicketMessage(orderNumber, deliveryDriverName || 'Repartidor', 'delivery', companyName);
          
          const result = await sendTicketViaWhatsApp({
            phoneNumber: fullPhoneNumber,
            message,
            ticketUrl: deliveryTicketUrl,
            ticketType: 'delivery',
          });

          if (result.success) {
            successCount++;
            console.log('✅ Ticket de envío enviado al repartidor exitosamente');
          } else {
            errorCount++;
            console.error('❌ Error al enviar ticket de envío al repartidor:', result.error);
          }
        } catch (error: any) {
          errorCount++;
          console.error('Error enviando ticket al repartidor:', error);
        }
      }

      // Enviar email al cliente si está seleccionado
      if (sendEmailToClient && clientEmail) {
        try {
          console.log('📧 WhatsApp Modal - Enviando email al cliente:', {
            email: clientEmail,
            clientName,
            orderNumber
          });
          
          const result = await sendOrderEmail({
            to: clientEmail,
            orderNumber,
            clientName: clientName || 'Cliente',
            ticketType: 'sale',
            ticketImageUrl: saleTicketUrl, // Pasar la URL de la imagen del ticket
            companyName,
          });

          if (result.success) {
            successCount++;
            console.log('✅ Email enviado al cliente exitosamente');
          } else {
            errorCount++;
            console.error('❌ Error al enviar email al cliente:', result.error);
          }
        } catch (error: any) {
          errorCount++;
          console.error('Error enviando email al cliente:', error);
        }
      }

      // Guardar país si se seleccionó recordar
      if (rememberCountry && successCount > 0) {
        saveLastUsedCountry(sendToClient ? clientSelectedCountry : driverSelectedCountry);
      }

      // Mostrar resultado
      if (successCount > 0 && errorCount === 0) {
        const messages = [];
        if (sendToClient) messages.push('WhatsApp al cliente');
        if (sendToDriver) messages.push('WhatsApp al repartidor');
        if (sendEmailToClient) messages.push('Email al cliente');
        toast.success(`✅ Enviado exitosamente: ${messages.join(', ')}`);
        onSuccess?.();
        onClose();
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning(`${successCount} envío(s) exitoso(s), ${errorCount} fallo(s)`);
        onSuccess?.();
        onClose();
      } else {
        toast.error('Error al enviar los mensajes');
      }
    } catch (error: any) {
      console.error('Error enviando tickets:', error);
      toast.error('Error al enviar los tickets por WhatsApp');
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
            Enviar Tickets por WhatsApp y Email
          </DialogTitle>
          <DialogDescription>
            Selecciona cómo deseas enviar los tickets disponibles
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Información de la orden */}
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Orden:</strong> #{orderNumber}
            </p>
            {clientName && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Cliente:</strong> {clientName}
              </p>
            )}
            {deliveryDriverName && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Repartidor:</strong> {deliveryDriverName}
              </p>
            )}
          </div>

          {/* Opción 1: Enviar ticket de venta al cliente */}
          {saleTicketUrl && (
            <div className={`border rounded-lg p-4 space-y-3 ${!activeWhatsApp ? 'opacity-50' : ''}`}>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendToClient"
                  checked={sendToClient}
                  onCheckedChange={(checked) => setSendToClient(checked as boolean)}
                  disabled={!activeWhatsApp}
                />
                <Label
                  htmlFor="sendToClient"
                  className="font-medium cursor-pointer"
                >
                  Enviar ticket de venta al cliente (Imagen)
                </Label>
              </div>
              {!activeWhatsApp && (
                <p className="text-xs text-amber-600 dark:text-amber-400">WhatsApp no está activo para esta empresa</p>
              )}

              {sendToClient && (
                <div className="pl-6 space-y-3">
                  {/* Selector de país para cliente */}
                  <div className="space-y-2">
                    <Label className="text-sm">País</Label>
                    <Select
                      value={clientSelectedCountry.code}
                      onValueChange={(value) => {
                        const country = countries.find(c => c.code === value);
                        if (country) setClientSelectedCountry(country);
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue>
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{clientSelectedCountry.flag}</span>
                            <span>{clientSelectedCountry.name}</span>
                            <span className="text-gray-500">+{clientSelectedCountry.dialCode}</span>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
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

                  {/* Número del cliente */}
                  <div className="space-y-2">
                    <Label className="text-sm">Número de teléfono</Label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 rounded-l-md">
                        <span className="text-sm font-medium">+{clientSelectedCountry.dialCode}</span>
                      </div>
                      <Input
                        type="tel"
                        placeholder={clientSelectedCountry.format?.replace(/#/g, '0') || 'Número'}
                        value={clientPhoneNumber}
                        onChange={(e) => setClientPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        className={`flex-1 h-9 ${clientPhoneError ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {clientPhoneError && (
                      <p className="text-sm text-red-500">{clientPhoneError}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Opción 2: Enviar ticket de envío al repartidor */}
          {deliveryTicketUrl && (
            <div className={`border rounded-lg p-4 space-y-3 ${!activeWhatsApp ? 'opacity-50' : ''}`}>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendToDriver"
                  checked={sendToDriver}
                  onCheckedChange={(checked) => setSendToDriver(checked as boolean)}
                  disabled={!activeWhatsApp}
                />
                <Label
                  htmlFor="sendToDriver"
                  className="font-medium cursor-pointer"
                >
                  Enviar ticket de envío al repartidor
                </Label>
              </div>
              {!activeWhatsApp && (
                <p className="text-xs text-amber-600 dark:text-amber-400">WhatsApp no está activo para esta empresa</p>
              )}

              {sendToDriver && (
                <div className="pl-6 space-y-3">
                  {/* Selector de país para repartidor */}
                  <div className="space-y-2">
                    <Label className="text-sm">País</Label>
                    <Select
                      value={driverSelectedCountry.code}
                      onValueChange={(value) => {
                        const country = countries.find(c => c.code === value);
                        if (country) setDriverSelectedCountry(country);
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue>
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{driverSelectedCountry.flag}</span>
                            <span>{driverSelectedCountry.name}</span>
                            <span className="text-gray-500">+{driverSelectedCountry.dialCode}</span>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
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

                  {/* Número del repartidor */}
                  <div className="space-y-2">
                    <Label className="text-sm">Número de teléfono</Label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 rounded-l-md">
                        <span className="text-sm font-medium">+{driverSelectedCountry.dialCode}</span>
                      </div>
                      <Input
                        type="tel"
                        placeholder={driverSelectedCountry.format?.replace(/#/g, '0') || 'Número'}
                        value={driverPhoneNumber}
                        onChange={(e) => setDriverPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        className={`flex-1 h-9 ${driverPhoneError ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {driverPhoneError && (
                      <p className="text-sm text-red-500">{driverPhoneError}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Opción 3: Enviar por Email al cliente */}
          {clientEmail && (
            <div className="border rounded-lg p-4 space-y-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendEmailToClient"
                  checked={sendEmailToClient}
                  onCheckedChange={(checked) => setSendEmailToClient(checked as boolean)}
                />
                <Label
                  htmlFor="sendEmailToClient"
                  className="font-medium cursor-pointer"
                >
                  Enviar confirmación por Email al cliente
                </Label>
              </div>
              
              {sendEmailToClient && (
                <div className="pl-6 space-y-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p><strong>Email:</strong> {clientEmail}</p>
                    <p className="mt-1">
                      Se enviará un correo con la confirmación de la orden
                      {saleTicketUrl && <span className="text-green-600 font-medium"> incluyendo el ticket adjunto (imagen)</span>}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

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
            <AlertDescription className="text-sm">
              <p>Los tickets se enviarán como imágenes visibles en el chat de WhatsApp.</p>
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
            disabled={sending || (!sendToClient && !sendToDriver && !sendEmailToClient)}
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
                Enviar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppTicketModal;