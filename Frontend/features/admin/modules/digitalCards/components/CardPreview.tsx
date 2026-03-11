"use client"

import React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  const memberCode = `TC-${new Date().getFullYear()}-${client.clientNumber.slice(-5) || '78523'}`;

  return (
    <div className={`w-full max-w-xs mx-auto ${className}`}>
      <Card className="rounded-xl border shadow-sm overflow-hidden text-sm">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">
              {branch.name ? branch.name.charAt(0).toUpperCase() : 'Z'}
            </span>
          </div>
          <span className="text-foreground font-semibold text-sm">
            {branch.name || 'TechCorp'}
          </span>
        </div>

        {/* Points Section */}
        <div className="px-4 pt-3 pb-2">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
              PUNTOS ACUMULADOS
            </p>
            <div className="flex items-center gap-2">
              <p className="text-foreground font-bold text-xl">
                {client.points.toLocaleString('es-MX')}
              </p>
              <Badge variant="secondary" className="text-[10px]">pts</Badge>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-4 pb-2">
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
            USUARIO
          </p>
          <p className="text-foreground text-base font-medium">
            {client.name} {client.lastName}
          </p>
        </div>

        {/* QR Code Section */}
        <div className="mx-4 mb-3 border rounded-lg p-2 flex flex-col items-center">
          <div className="p-1 mb-1">
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

                {/* Data patterns */}
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
          <p className="text-muted-foreground text-xs font-mono tracking-wider">
            {memberCode}
          </p>
        </div>

        {/* Decorative Image */}
        <div className="relative h-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-background/30 z-10" />
          {digitalCard.heroUrl ? (
            <Image
              src={digitalCard.heroUrl}
              alt="Imagen decorativa"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 opacity-60">
              <div className="absolute bottom-0 left-0 w-full h-full">
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-red-400 rounded-full transform translate-y-10"></div>
                <div className="absolute bottom-0 left-16 w-24 h-24 bg-yellow-400 rounded-full transform translate-y-12"></div>
                <div className="absolute bottom-0 left-36 w-20 h-20 bg-pink-400 rounded-full transform translate-y-12"></div>
                <div className="absolute bottom-0 right-20 w-24 h-24 bg-orange-400 rounded-full transform translate-y-12"></div>
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-purple-400 rounded-full transform translate-y-10"></div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CardPreview;