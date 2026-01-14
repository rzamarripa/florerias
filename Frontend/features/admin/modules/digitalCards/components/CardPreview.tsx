import React from 'react';
import { 
  Award, 
  Phone, 
  Mail,
  Star,
  X,
  Download,
  CreditCard
} from 'lucide-react';
import Image from 'next/image';

interface CardPreviewProps {
  digitalCard: {
    _id: string;
    qrCode?: string; // Base64 - ahora opcional
    qrCodeUrl?: string; // URL del QR en Firebase
    barcode?: string;
    lastPointsBalance: number;
    lastUpdated: Date;
    expiresAt: Date;
    metadata: {
      backgroundColor: string;
      foregroundColor: string;
      labelColor: string;
      logoText: string;
    };
    rotationSchedule: {
      nextRotation: Date;
    };
  };
  client: {
    name: string;
    lastName: string;
    clientNumber: string;
    phoneNumber: string;
    email?: string;
    points: number;
  };
  branch: {
    name: string;
    address?: string;
  };
  showFullDetails?: boolean;
  className?: string;
  onClose?: () => void;
  onDownload?: () => void;
}

const CardPreview: React.FC<CardPreviewProps> = ({
  digitalCard,
  client,
  branch,
  showFullDetails = true,
  className = '',
  onClose,
  onDownload,
}) => {
  const getClientLevel = (points: number) => {
    if (points >= 1000) return { name: 'Elite', maxPoints: 2000 };
    if (points >= 500) return { name: 'Platino', maxPoints: 1000 };
    if (points >= 100) return { name: 'Oro', maxPoints: 500 };
    return { name: 'Platino', maxPoints: 100 };
  };

  const level = getClientLevel(client.points);
  const progressPercentage = Math.min((client.points / level.maxPoints) * 100, 100);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className={`${className}`} 
      style={{
        background: 'linear-gradient(to bottom right, rgb(15, 23, 42), rgb(30, 41, 59), rgb(15, 23, 42))',
        borderRadius: '0.75rem',
        overflow: 'hidden'
      }}
    >
      {/* Card Content */}
      <div className="p-4">
        {/* Premium Card with Gradient */}
        <div 
          className="position-relative rounded-3 p-1 shadow-lg"
          style={{
            background: 'linear-gradient(to bottom right, rgb(6, 182, 212), rgb(59, 130, 246), rgb(147, 51, 234))',
            boxShadow: '0 20px 25px -5px rgba(6, 182, 212, 0.2)'
          }}
        >
          <div 
            className="position-relative rounded-3 p-4"
            style={{
              background: 'linear-gradient(to bottom right, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
              backdropFilter: 'blur(48px)'
            }}
          >
            {/* Decorative Elements */}
            <div 
              className="position-absolute top-0 end-0"
              style={{
                width: '128px',
                height: '128px',
                background: 'rgba(6, 182, 212, 0.1)',
                borderRadius: '50%',
                filter: 'blur(48px)'
              }}
            />
            <div 
              className="position-absolute bottom-0 start-0"
              style={{
                width: '128px',
                height: '128px',
                background: 'rgba(147, 51, 234, 0.1)',
                borderRadius: '50%',
                filter: 'blur(48px)'
              }}
            />

            <div className="position-relative">
              {/* Level Badge and Card Number */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div 
                  className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill border"
                  style={{
                    background: 'linear-gradient(to right, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))',
                    borderColor: 'rgba(251, 191, 36, 0.3)'
                  }}
                >
                  <Award size={16} style={{ color: '#fbbf24' }} />
                  <span className="small fw-semibold" style={{ color: '#fef3c7' }}>
                    {level.name}
                  </span>
                </div>
                <div className="small font-monospace" style={{ color: '#94a3b8' }}>
                  #{client.clientNumber}
                </div>
              </div>

              {/* Cardholder Name */}
              <div className="mb-4">
                <p className="small mb-1" style={{ color: '#94a3b8' }}>Titular</p>
                <h3 className="h3 fw-bold text-white" style={{ letterSpacing: '0.05em' }}>
                  {client.name} {client.lastName}
                </h3>
              </div>

              {/* Contact Info */}
              <div className="row g-4">
                <div className="col-6">
                  <div className="d-flex gap-2">
                    <Phone size={16} style={{ color: '#06b6d4', marginTop: '2px' }} />
                    <div>
                      <p className="small mb-0" style={{ color: '#94a3b8' }}>Teléfono</p>
                      <p className="small fw-medium mb-0" style={{ color: '#e2e8f0' }}>
                        {client.phoneNumber}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="d-flex gap-2">
                    <Mail size={16} style={{ color: '#06b6d4', marginTop: '2px' }} />
                    <div className="text-truncate">
                      <p className="small mb-0" style={{ color: '#94a3b8' }}>Email</p>
                      <p className="small fw-medium mb-0 text-truncate" style={{ color: '#e2e8f0' }}>
                        {client.email || 'No registrado'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="d-flex flex-column align-items-center gap-3 p-4 rounded-3 bg-white mt-4">
          <div className="rounded-2 overflow-hidden">
            {digitalCard.qrCodeUrl ? (
              <Image 
                src={digitalCard.qrCodeUrl} 
                alt="QR Code" 
                width={160}
                height={160}
                style={{ display: 'block' }}
                unoptimized
              />
            ) : digitalCard.qrCode ? (
              <Image 
                src={digitalCard.qrCode} 
                alt="QR Code" 
                width={160}
                height={160}
                style={{ display: 'block' }}
              />
            ) : (
              <div 
                className="d-flex align-items-center justify-content-center"
                style={{ width: 160, height: 160, backgroundColor: '#f3f4f6' }}
              >
                <span className="text-muted">QR no disponible</span>
              </div>
            )}
          </div>
          <p className="small fw-medium text-secondary mb-0">Escanea para compartir</p>
        </div>

        {/* Points Section */}
        <div 
          className="p-4 rounded-3 border mt-4"
          style={{
            background: 'linear-gradient(to bottom right, rgb(30, 41, 59), rgb(15, 23, 42))',
            borderColor: 'rgb(51, 65, 85)'
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="small fw-medium" style={{ color: '#94a3b8' }}>
              Puntos Acumulados
            </span>
            <div className="d-flex align-items-center gap-1">
              <Star size={20} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
              <span className="h3 fw-bold text-white mb-0">{client.points}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div 
              className="rounded-pill overflow-hidden mb-2"
              style={{ height: '8px', backgroundColor: 'rgb(51, 65, 85)' }}
            >
              <div
                className="h-100 rounded-pill"
                style={{
                  width: `${progressPercentage}%`,
                  background: 'linear-gradient(to right, rgb(6, 182, 212), rgb(59, 130, 246), rgb(147, 51, 234))',
                  transition: 'width 0.5s ease'
                }}
              />
            </div>
            <div className="d-flex justify-content-between">
              <span className="small" style={{ color: '#94a3b8' }}>Nivel Inicial</span>
              <span className="small" style={{ color: '#94a3b8' }}>Nivel Elite</span>
            </div>
          </div>
        </div>

        {/* Member Since */}
        <p className="text-center small mt-4 mb-0" style={{ color: '#64748b' }}>
          Miembro desde {formatDate(digitalCard.expiresAt)}
        </p>
      </div>
    </div>
  );
};

export default CardPreview;