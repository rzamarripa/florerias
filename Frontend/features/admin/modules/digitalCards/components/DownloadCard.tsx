import React from 'react';
import { Modal, Button, ButtonGroup } from 'react-bootstrap';
import { 
  Download, 
  Share2, 
  Smartphone,
  Mail,
  Copy,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-toastify';

interface DownloadCardProps {
  show: boolean;
  onHide: () => void;
  card: {
    _id: string;
    qrCode: string;
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
    const link = document.createElement('a');
    link.download = `QR-${client.clientNumber}.png`;
    link.href = card.qrCode;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR descargado correctamente');
  };

  const shareViaWhatsApp = () => {
    const message = `Hola ${client.name}, aquí está tu tarjeta digital de Corazón Violeta`;
    const url = `${window.location.origin}/digital-card/view/${card._id}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message + ' ' + url)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaEmail = () => {
    const subject = 'Tu tarjeta digital de Corazón Violeta';
    const body = `Hola ${client.name} ${client.lastName},\n\nTu tarjeta digital está disponible en:\n${window.location.origin}/digital-card/view/${card._id}\n\nGracias por ser parte de nuestro programa de fidelidad.`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const copyLink = () => {
    const url = `${window.location.origin}/digital-card/view/${card._id}`;
    navigator.clipboard.writeText(url);
    toast.success('Enlace copiado al portapapeles');
  };

  const saveToPhotos = () => {
    // En móviles, esto abrirá el diálogo de guardar imagen
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      
      img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `QR-${client.clientNumber}.png`, { type: 'image/png' });
            
            if (navigator.share) {
              navigator.share({
                files: [file],
                title: 'Tarjeta Digital',
                text: 'Mi tarjeta de fidelidad'
              }).catch(() => {
                // Si falla el share, descargar normalmente
                downloadQRAsImage();
              });
            } else {
              downloadQRAsImage();
            }
          }
        });
      };
      
      img.src = card.qrCode;
    } else {
      downloadQRAsImage();
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Descargar Tarjeta Digital</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h6 className="mb-3">Cliente: {client.name} {client.lastName}</h6>
        
        <div className="d-grid gap-2">
          <Button 
            variant="primary" 
            size="lg"
            onClick={downloadQRAsImage}
            className="d-flex align-items-center justify-content-center gap-2"
          >
            <Download size={20} />
            Descargar QR como Imagen
          </Button>

          <Button 
            variant="outline-primary"
            onClick={saveToPhotos}
            className="d-flex align-items-center justify-content-center gap-2"
          >
            <ImageIcon size={20} />
            Guardar en Fotos
          </Button>

          {/* Botones de wallet deshabilitados hasta configurar */}
          {onDownloadApple && (
            <Button 
              variant="dark"
              onClick={onDownloadApple}
              disabled
              className="d-flex align-items-center justify-content-center gap-2"
            >
              <Smartphone size={20} />
              Agregar a Apple Wallet
              <small className="ms-2">(Próximamente)</small>
            </Button>
          )}

          {onDownloadGoogle && (
            <Button 
              variant="outline-dark"
              onClick={onDownloadGoogle}
              disabled
              className="d-flex align-items-center justify-content-center gap-2"
            >
              <Smartphone size={20} />
              Agregar a Google Wallet
              <small className="ms-2">(Próximamente)</small>
            </Button>
          )}

          <hr className="my-3" />

          <h6 className="text-center mb-3">Compartir</h6>

          <ButtonGroup className="w-100">
            <Button 
              variant="success"
              onClick={shareViaWhatsApp}
              className="d-flex align-items-center justify-content-center gap-2"
            >
              <Share2 size={18} />
              WhatsApp
            </Button>

            <Button 
              variant="info"
              onClick={shareViaEmail}
              className="text-white d-flex align-items-center justify-content-center gap-2"
            >
              <Mail size={18} />
              Email
            </Button>

            <Button 
              variant="secondary"
              onClick={copyLink}
              className="d-flex align-items-center justify-content-center gap-2"
            >
              <Copy size={18} />
              Copiar
            </Button>
          </ButtonGroup>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DownloadCard;