"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { User, Phone, Mail, Award, Calendar, Building, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DigitalCardPublic {
  _id: string;
  client: {
    name: string;
    lastName: string;
    clientNumber: string;
    phoneNumber: string;
    email?: string;
    points: number;
  };
  qrCode: string;
  expiresAt: Date;
  lastUpdated: Date;
  isActive: boolean;
  metadata: {
    backgroundColor: string;
    foregroundColor: string;
    labelColor: string;
    logoText: string;
  };
  branch: {
    name: string;
    address?: string;
  };
}

export default function PublicDigitalCardView() {
  const params = useParams();
  const cardId = params?.cardId as string;

  const [card, setCard] = useState<DigitalCardPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cardId) {
      fetchCardData();
    }
  }, [cardId]);

  const fetchCardData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/digital-cards/public/${cardId}`
      );

      if (!response.ok) {
        throw new Error('Tarjeta no encontrada');
      }

      const data = await response.json();
      setCard(data.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la tarjeta');
    } finally {
      setLoading(false);
    }
  };

  const getClientLevel = (points: number) => {
    if (points >= 1000) return { name: 'Oro', variant: 'default' as const, className: 'bg-yellow-500' };
    if (points >= 500) return { name: 'Plata', variant: 'secondary' as const, className: '' };
    if (points >= 100) return { name: 'Bronce', variant: 'default' as const, className: 'bg-amber-600' };
    return { name: 'Inicial', variant: 'default' as const, className: '' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Tarjeta no disponible'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!card.isActive) {
    return (
      <div className="flex justify-content-center items-center min-h-screen p-4">
        <Alert>
          <AlertDescription>Esta tarjeta no está activa</AlertDescription>
        </Alert>
      </div>
    );
  }

  const level = getClientLevel(card.client.points);

  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{
        background: `linear-gradient(135deg, ${card.metadata.backgroundColor} 0%, ${card.metadata.foregroundColor} 100%)`
      }}
    >
      <div className="max-w-md mx-auto">
        <Card className="shadow-lg border-0">
          <CardHeader
            className="text-center text-white py-6"
            style={{ backgroundColor: card.metadata.backgroundColor }}
          >
            <h2 className="text-2xl font-bold">{card.metadata.logoText}</h2>
          </CardHeader>

          <CardContent className="p-0">
            <div className="text-center py-6 bg-muted">
              <div className="mb-4">
                {card.qrCode && (
                  <Image
                    src={card.qrCode}
                    alt="QR Code"
                    width={200}
                    height={200}
                    className="rounded mx-auto"
                  />
                )}
              </div>
              <Badge variant={level.variant} className={`px-4 py-2 text-base ${level.className}`}>
                Nivel {level.name}
              </Badge>
            </div>

            <div className="px-6 py-6">
              <div className="flex items-center mb-4">
                <User className="text-primary mr-4" size={20} />
                <div>
                  <div className="text-muted-foreground text-sm">Cliente</div>
                  <div className="font-bold">
                    {card.client.name} {card.client.lastName}
                  </div>
                </div>
              </div>

              <div className="flex items-center mb-4">
                <Award className="text-primary mr-4" size={20} />
                <div>
                  <div className="text-muted-foreground text-sm">Puntos Acumulados</div>
                  <div className="font-bold text-2xl text-primary">
                    {card.client.points.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center mb-4">
                <Phone className="text-primary mr-4" size={20} />
                <div>
                  <div className="text-muted-foreground text-sm">Teléfono</div>
                  <div className="font-bold">{card.client.phoneNumber}</div>
                </div>
              </div>

              {card.client.email && (
                <div className="flex items-center mb-4">
                  <Mail className="text-primary mr-4" size={20} />
                  <div>
                    <div className="text-muted-foreground text-sm">Email</div>
                    <div className="font-bold">{card.client.email}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center mb-4">
                <Building className="text-primary mr-4" size={20} />
                <div>
                  <div className="text-muted-foreground text-sm">Sucursal</div>
                  <div className="font-bold">{card.branch.name}</div>
                  {card.branch.address && (
                    <div className="text-sm text-muted-foreground">{card.branch.address}</div>
                  )}
                </div>
              </div>

              <hr className="my-4" />

              <div className="flex justify-between text-muted-foreground text-sm">
                <div className="flex items-center">
                  <Calendar size={14} className="mr-1" />
                  Cliente #: {card.client.clientNumber}
                </div>
                <div>
                  Válida hasta: {new Date(card.expiresAt).toLocaleDateString('es-MX')}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="text-center py-4 text-muted-foreground text-sm justify-center">
            Última actualización: {new Date(card.lastUpdated).toLocaleDateString('es-MX')}
          </CardFooter>
        </Card>

        <div className="text-center mt-6 text-white">
          <p className="mb-2">Muestra esta tarjeta en tu próxima compra</p>
          <p className="text-sm opacity-80">para acumular y canjear puntos</p>
        </div>
      </div>
    </div>
  );
}
