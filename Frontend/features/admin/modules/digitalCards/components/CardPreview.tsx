"use client"

import React from 'react';
import { MoreVertical } from 'lucide-react';
import Image from 'next/image';

interface CardPreviewProps {
  digitalCard: {
    _id: string;
    qrCode?: string; // Base64 - ahora opcional
    qrCodeUrl?: string; // URL del QR en Firebase
    heroUrl?: string; // URL de la imagen hero en Firebase
    heroPath?: string; // Path de la imagen hero en Firebase
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
  // Formatear el código del cliente
  const memberCode = `TC-${new Date().getFullYear()}-${client.clientNumber.slice(-5) || '78523'}`;

  return (
    <div className={`w-full max-w-sm mx-auto ${className}`}>
      {/* Card Container */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center p-1">
              {/* Logo placeholder - you can replace with actual logo */}
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {branch.name ? branch.name.charAt(0).toUpperCase() : 'Z'}
                </span>
              </div>
            </div>
            <span className="text-white font-semibold text-base">
              {branch.name || 'TechCorp'}
            </span>
          </div>
          <button 
            className="text-white/80 hover:text-white transition-colors"
            onClick={onClose}
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content - Points */}
        <div className="px-5 pb-4">
          <p className="text-white/70 text-xs uppercase tracking-wider mb-1">
            PUNTOS ACUMULADOS
          </p>
          <p className="text-white text-2xl font-semibold">
            {client.points.toLocaleString('es-MX')} pts
          </p>
        </div>

        {/* User Info */}
        <div className="px-5 pb-4">
          <p className="text-white/70 text-xs uppercase tracking-wider mb-1">
            USUARIO
          </p>
          <p className="text-white text-lg font-medium">
            {client.name} {client.lastName}
          </p>
        </div>

        {/* QR Code Section */}
        <div className="bg-white mx-5 mb-4 rounded-xl p-3 flex flex-col items-center">
          {/* QR Code - Show real QR if available */}
          <div className="bg-white p-1 mb-2">
            {digitalCard.qrCodeUrl || digitalCard.qrCode ? (
              <Image 
                src={digitalCard.qrCodeUrl || digitalCard.qrCode || ''} 
                alt="QR Code" 
                width={96}
                height={96}
                className="block"
                unoptimized
              />
            ) : (
              <svg
                viewBox="0 0 100 100"
                className="w-24 h-24"
                fill="currentColor"
              >
                {/* Corner squares */}
                <rect x="0" y="0" width="28" height="28" />
                <rect x="4" y="4" width="20" height="20" fill="white" />
                <rect x="8" y="8" width="12" height="12" />
                
                <rect x="72" y="0" width="28" height="28" />
                <rect x="76" y="4" width="20" height="20" fill="white" />
                <rect x="80" y="8" width="12" height="12" />
                
                <rect x="0" y="72" width="28" height="28" />
                <rect x="4" y="76" width="20" height="20" fill="white" />
                <rect x="8" y="80" width="12" height="12" />
                
                {/* Data patterns - creates a realistic QR code pattern */}
                <rect x="36" y="0" width="4" height="4" />
                <rect x="44" y="0" width="4" height="4" />
                <rect x="52" y="0" width="4" height="4" />
                <rect x="60" y="0" width="4" height="4" />
                
                <rect x="36" y="8" width="4" height="4" />
                <rect x="48" y="8" width="4" height="4" />
                <rect x="56" y="8" width="4" height="4" />
                
                <rect x="32" y="16" width="4" height="4" />
                <rect x="40" y="16" width="4" height="4" />
                <rect x="52" y="16" width="4" height="4" />
                <rect x="64" y="16" width="4" height="4" />
                
                <rect x="36" y="24" width="4" height="4" />
                <rect x="44" y="24" width="4" height="4" />
                <rect x="56" y="24" width="4" height="4" />
                
                <rect x="0" y="36" width="4" height="4" />
                <rect x="8" y="36" width="4" height="4" />
                <rect x="20" y="36" width="4" height="4" />
                <rect x="32" y="36" width="4" height="4" />
                <rect x="40" y="36" width="4" height="4" />
                <rect x="48" y="36" width="4" height="4" />
                <rect x="60" y="36" width="4" height="4" />
                <rect x="72" y="36" width="4" height="4" />
                <rect x="80" y="36" width="4" height="4" />
                <rect x="92" y="36" width="4" height="4" />
                
                <rect x="4" y="44" width="4" height="4" />
                <rect x="16" y="44" width="4" height="4" />
                <rect x="28" y="44" width="4" height="4" />
                <rect x="36" y="44" width="4" height="4" />
                <rect x="52" y="44" width="4" height="4" />
                <rect x="64" y="44" width="4" height="4" />
                <rect x="76" y="44" width="4" height="4" />
                <rect x="88" y="44" width="4" height="4" />
                
                <rect x="0" y="52" width="4" height="4" />
                <rect x="12" y="52" width="4" height="4" />
                <rect x="24" y="52" width="4" height="4" />
                <rect x="40" y="52" width="4" height="4" />
                <rect x="48" y="52" width="4" height="4" />
                <rect x="56" y="52" width="4" height="4" />
                <rect x="68" y="52" width="4" height="4" />
                <rect x="80" y="52" width="4" height="4" />
                <rect x="96" y="52" width="4" height="4" />
                
                <rect x="8" y="60" width="4" height="4" />
                <rect x="20" y="60" width="4" height="4" />
                <rect x="32" y="60" width="4" height="4" />
                <rect x="44" y="60" width="4" height="4" />
                <rect x="60" y="60" width="4" height="4" />
                <rect x="72" y="60" width="4" height="4" />
                <rect x="84" y="60" width="4" height="4" />
                
                <rect x="36" y="72" width="4" height="4" />
                <rect x="48" y="72" width="4" height="4" />
                <rect x="56" y="72" width="4" height="4" />
                <rect x="68" y="72" width="4" height="4" />
                
                <rect x="72" y="76" width="4" height="4" />
                <rect x="80" y="76" width="4" height="4" />
                <rect x="92" y="76" width="4" height="4" />
                
                <rect x="36" y="80" width="4" height="4" />
                <rect x="44" y="80" width="4" height="4" />
                <rect x="60" y="80" width="4" height="4" />
                <rect x="76" y="80" width="4" height="4" />
                <rect x="88" y="80" width="4" height="4" />
                
                <rect x="32" y="88" width="4" height="4" />
                <rect x="48" y="88" width="4" height="4" />
                <rect x="56" y="88" width="4" height="4" />
                <rect x="72" y="88" width="4" height="4" />
                <rect x="84" y="88" width="4" height="4" />
                <rect x="96" y="88" width="4" height="4" />
                
                <rect x="36" y="96" width="4" height="4" />
                <rect x="44" y="96" width="4" height="4" />
                <rect x="52" y="96" width="4" height="4" />
                <rect x="64" y="96" width="4" height="4" />
                <rect x="76" y="96" width="4" height="4" />
                <rect x="88" y="96" width="4" height="4" />
              </svg>
            )}
          </div>
          <p className="text-gray-600 text-sm font-mono tracking-wider">
            {memberCode}
          </p>
        </div>

        {/* Decorative Image */}
        <div className="relative h-36 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-blue-700/40 z-10" />
          {digitalCard.heroUrl ? (
            <Image
              src={digitalCard.heroUrl}
              alt="Imagen decorativa"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            // Fallback con gradiente de colores si no hay imagen
            <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 opacity-60">
              <div className="absolute bottom-0 left-0 w-full h-full">
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-red-400 rounded-full transform translate-y-10"></div>
                <div className="absolute bottom-0 left-16 w-24 h-24 bg-yellow-400 rounded-full transform translate-y-12"></div>
                <div className="absolute bottom-0 left-36 w-20 h-20 bg-pink-400 rounded-full transform translate-y-10"></div>
                <div className="absolute bottom-0 right-20 w-24 h-24 bg-orange-400 rounded-full transform translate-y-12"></div>
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-purple-400 rounded-full transform translate-y-10"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardPreview;