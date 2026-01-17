import React from 'react';
import {
  Download,
  Share2,
  Smartphone,
  Mail,
  Copy,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface DownloadCardProps {
  show: boolean;
  onHide: () => void;
  card: {
    _id: string;
    qrCode?: string; // Base64 - ahora opcional para compatibilidad
    qrCodeUrl?: string; // URL del QR en Firebase
    passSerialNumber: string;
  };
  client: {
    name: string;
    lastName: string;
    clientNumber: string;
  };
  onDownloadApple?: () => void;
  onDownloadGoogle?: () => void;
}

const DownloadCard: React.FC<DownloadCardProps> = ({
  show,
  onHide,
  card,
  client,
  onDownloadApple,
  onDownloadGoogle,
}) => {
  const downloadQRAsImage = () => {
    try {
      // Determinar la fuente del QR (URL de Firebase o base64)
      const qrSource = card.qrCodeUrl || card.qrCode;

      if (!qrSource) {
        toast.error('No hay codigo QR disponible para descargar');
        return;
      }

      // Solucion simple: abrir directamente la URL para descargar
      // Firebase Storage permite acceso directo a las imagenes
      if (card.qrCodeUrl) {
        // Crear un link invisible con el atributo download
        // Esto funciona porque Firebase Storage ya permite el acceso directo
        const link = document.createElement('a');
        link.download = `QR-${client.clientNumber}.png`;
        link.href = card.qrCodeUrl;
        link.target = '_blank'; // Abrir en nueva pestana si falla la descarga
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Descargando QR...');
      } else {
        // Si es base64 (compatibilidad con tarjetas antiguas)
        const link = document.createElement('a');
        link.download = `QR-${client.clientNumber}.png`;
        link.href = card.qrCode!;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('QR descargado correctamente');
      }
    } catch (error) {
      console.error('Error descargando QR:', error);
      toast.error('Error al descargar el codigo QR');
    }
  };

  const shareViaWhatsApp = () => {
    const message = `Hola ${client.name}, aqui esta tu tarjeta digital de Corazon Violeta`;
    const url = `${window.location.origin}/digital-card/view/${card._id}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message + ' ' + url)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaEmail = () => {
    const subject = 'Tu tarjeta digital de Corazon Violeta';
    const body = `Hola ${client.name} ${client.lastName},\n\nTu tarjeta digital esta disponible en:\n${window.location.origin}/digital-card/view/${card._id}\n\nGracias por ser parte de nuestro programa de fidelidad.`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const copyLink = () => {
    const url = `${window.location.origin}/digital-card/view/${card._id}`;
    navigator.clipboard.writeText(url);
    toast.success('Enlace copiado al portapapeles');
  };

  const saveToPhotos = () => {
    // En moviles, usar el share nativo o simplemente descargar
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      // Para moviles, intentar compartir la URL directamente
      if (navigator.share && card.qrCodeUrl) {
        navigator.share({
          title: 'Tarjeta Digital - QR',
          text: `QR de ${client.name} ${client.lastName}`,
          url: card.qrCodeUrl
        }).catch(() => {
          // Si falla el share, descargar normalmente
          downloadQRAsImage();
        });
      } else {
        // Si no hay API de share o es base64, descargar normal
        downloadQRAsImage();
      }
    } else {
      // En desktop, descargar normal
      downloadQRAsImage();
    }
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Descargar Tarjeta Digital</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <h6 className="mb-4 font-medium">Cliente: {client.name} {client.lastName}</h6>

          <div className="grid gap-3">
            <Button
              variant="default"
              size="lg"
              onClick={downloadQRAsImage}
              className="w-full flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Descargar QR como Imagen
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={saveToPhotos}
              className="w-full flex items-center justify-center gap-2"
            >
              <ImageIcon size={20} />
              Guardar en Fotos
            </Button>

            {/* Botones de wallet deshabilitados hasta configurar */}
            {onDownloadApple && (
              <Button
                variant="secondary"
                size="lg"
                onClick={onDownloadApple}
                disabled
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white hover:bg-gray-800"
              >
                <Smartphone size={20} />
                Agregar a Apple Wallet
                <small className="ml-2 opacity-70">(Proximamente)</small>
              </Button>
            )}

            {onDownloadGoogle && (
              <Button
                variant="outline"
                size="lg"
                onClick={onDownloadGoogle}
                disabled
                className="w-full flex items-center justify-center gap-2"
              >
                <Smartphone size={20} />
                Agregar a Google Wallet
                <small className="ml-2 opacity-70">(Proximamente)</small>
              </Button>
            )}

            <hr className="my-3" />

            <h6 className="text-center mb-3 font-medium">Compartir</h6>

            <div className="flex gap-2 w-full">
              <Button
                variant="default"
                onClick={shareViaWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Share2 size={18} />
                WhatsApp
              </Button>

              <Button
                variant="default"
                onClick={shareViaEmail}
                className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700"
              >
                <Mail size={18} />
                Email
              </Button>

              <Button
                variant="secondary"
                onClick={copyLink}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Copy size={18} />
                Copiar
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onHide}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadCard;
