"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Container, Card, Row, Col, Spinner, Alert, Badge } from "react-bootstrap";
import Image from "next/image";
import { User, Phone, Mail, Award, Calendar, Building } from "lucide-react";

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
    if (points >= 1000) return { name: 'Oro', color: 'warning' };
    if (points >= 500) return { name: 'Plata', color: 'secondary' };
    if (points >= 100) return { name: 'Bronce', color: 'info' };
    return { name: 'Inicial', color: 'primary' };
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error || !card) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Alert variant="danger">
          {error || 'Tarjeta no disponible'}
        </Alert>
      </Container>
    );
  }

  if (!card.isActive) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Alert variant="warning">
          Esta tarjeta no está activa
        </Alert>
      </Container>
    );
  }

  const level = getClientLevel(card.client.points);

  return (
    <div 
      className="min-vh-100 py-5"
      style={{ 
        background: `linear-gradient(135deg, ${card.metadata.backgroundColor} 0%, ${card.metadata.foregroundColor} 100%)`
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={6} lg={5}>
            <Card className="shadow-lg border-0">
              <Card.Header 
                className="text-center text-white py-4"
                style={{ backgroundColor: card.metadata.backgroundColor }}
              >
                <h2 className="mb-0">{card.metadata.logoText}</h2>
              </Card.Header>
              
              <Card.Body className="p-0">
                <div className="text-center py-4 bg-light">
                  <div className="mb-3">
                    {card.qrCode && (
                      <Image
                        src={card.qrCode}
                        alt="QR Code"
                        width={200}
                        height={200}
                        className="rounded"
                      />
                    )}
                  </div>
                  <Badge bg={level.color} className="px-3 py-2 fs-6">
                    Nivel {level.name}
                  </Badge>
                </div>

                <div className="px-4 py-4">
                  <div className="d-flex align-items-center mb-3">
                    <User className="text-primary me-3" size={20} />
                    <div>
                      <div className="text-muted small">Cliente</div>
                      <div className="fw-bold">
                        {card.client.name} {card.client.lastName}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center mb-3">
                    <Award className="text-primary me-3" size={20} />
                    <div>
                      <div className="text-muted small">Puntos Acumulados</div>
                      <div className="fw-bold fs-4 text-primary">
                        {card.client.points.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center mb-3">
                    <Phone className="text-primary me-3" size={20} />
                    <div>
                      <div className="text-muted small">Teléfono</div>
                      <div className="fw-bold">{card.client.phoneNumber}</div>
                    </div>
                  </div>

                  {card.client.email && (
                    <div className="d-flex align-items-center mb-3">
                      <Mail className="text-primary me-3" size={20} />
                      <div>
                        <div className="text-muted small">Email</div>
                        <div className="fw-bold">{card.client.email}</div>
                      </div>
                    </div>
                  )}

                  <div className="d-flex align-items-center mb-3">
                    <Building className="text-primary me-3" size={20} />
                    <div>
                      <div className="text-muted small">Sucursal</div>
                      <div className="fw-bold">{card.branch.name}</div>
                      {card.branch.address && (
                        <div className="small text-muted">{card.branch.address}</div>
                      )}
                    </div>
                  </div>

                  <hr className="my-3" />

                  <div className="d-flex justify-content-between text-muted small">
                    <div>
                      <Calendar size={14} className="me-1" />
                      Cliente #: {card.client.clientNumber}
                    </div>
                    <div>
                      Válida hasta: {new Date(card.expiresAt).toLocaleDateString('es-MX')}
                    </div>
                  </div>
                </div>
              </Card.Body>

              <Card.Footer className="text-center py-3 text-muted small">
                Última actualización: {new Date(card.lastUpdated).toLocaleDateString('es-MX')}
              </Card.Footer>
            </Card>

            <div className="text-center mt-4 text-white">
              <p className="mb-2">Muestra esta tarjeta en tu próxima compra</p>
              <p className="small">para acumular y canjear puntos</p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}