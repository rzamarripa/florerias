import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Spinner, Alert, Form, Table } from 'react-bootstrap';
import { CreditCard, Download, QrCode, Search, ScanLine, X } from 'lucide-react';
import { toast } from 'react-toastify';
import CardPreview from './components/CardPreview';
import DownloadCard from './components/DownloadCard';
import QRScanner from './components/QRScanner';
import digitalCardService from './services/digitalCardService';
import { clientsService } from '../clients/services/clients';
import { branchesService } from '../branches/services/branches';
import { companiesService } from '../companies/services/companies';
import { uploadDigitalCardQR } from '@/services/firebaseStorage';
import { useUserSessionStore } from '@/stores/userSessionStore';
import { useUserRoleStore } from '@/stores/userRoleStore';
import { useActiveBranchStore } from '@/stores/activeBranchStore';

interface DigitalCardClient {
  _id: string;
  name: string;
  lastName: string;
  clientNumber: string;
  phoneNumber: string;
  email?: string;
  points: number;
  status: boolean;
  branch: {
    _id: string;
    name: string;
    address?: string;
  };
}

const DigitalCardsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<DigitalCardClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<DigitalCardClient | null>(null);
  const [digitalCard, setDigitalCard] = useState<any>(null);
  const [digitalCards, setDigitalCards] = useState<Record<string, any>>({});
  const [showCardModal, setShowCardModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentBranchId, setCurrentBranchId] = useState<string>('');
  
  const { user } = useUserSessionStore();
  const { role } = useUserRoleStore();
  const { activeBranch } = useActiveBranchStore();

  useEffect(() => {
    loadBranchAndClients();
  }, [user, activeBranch]);

  const loadBranchAndClients = async () => {
    try {
      setLoading(true);
      
      let currentBranchId = '';
      
      // Si es Super Admin y tiene sucursal activa, usar esa
      if (role === 'Super Admin' && activeBranch) {
        currentBranchId = activeBranch._id;
      } 
      // Si es Gerente, buscar su sucursal
      else if (role === 'Gerente' && user?._id) {
        try {
          // Buscar la sucursal donde este usuario es gerente
          const branches = await branchesService.getAllBranches({ 
            managerId: user._id 
          });
          
          if (branches.data && branches.data.length > 0) {
            currentBranchId = branches.data[0]._id;
          } else {
            toast.error('No se encontró una sucursal asignada a este gerente');
            return;
          }
        } catch (error) {
          console.error('Error buscando sucursal del gerente:', error);
          toast.error('Error al buscar sucursal del gerente');
          return;
        }
      }
      // Para otros roles, usar la sucursal activa
      else if (activeBranch) {
        currentBranchId = activeBranch._id;
      }
      
      if (!currentBranchId) {
        toast.warning('No se pudo determinar la sucursal');
        return;
      }
      
      setCurrentBranchId(currentBranchId);
      
      // Cargar clientes de la sucursal
      const response = await clientsService.getAllClients({ 
        branchId: currentBranchId,
        limit: 100 
      });
      
      if (response.success && response.data) {
        // Obtener información de la sucursal
        const branchInfo = await branchesService.getBranchById(currentBranchId);
        const branch = branchInfo.data;
        
        // Obtener el companyId de la sucursal
        let branchCompanyId = '';
        if (branch.companyId) {
          if (typeof branch.companyId === 'object' && branch.companyId !== null) {
            branchCompanyId = (branch.companyId as any)._id || '';
          } else if (typeof branch.companyId === 'string') {
            branchCompanyId = branch.companyId;
          }
        }
        
        // Mapear los clientes para incluir el objeto branch completo con companyId
        const clientsWithBranch = response.data.map((client: any) => ({
          ...client,
          branch: {
            _id: branch._id || currentBranchId,
            name: branch.branchName || branch.name || 'Sucursal',
            address: branch.address || '',
            companyId: branchCompanyId // Incluir el companyId aquí
          }
        }));
        
        setClients(clientsWithBranch);
        
        // Load digital cards for all clients
        const cardsMap: Record<string, any> = {};
        for (const client of clientsWithBranch) {
          try {
            const card = await digitalCardService.getDigitalCard(client._id);
            if (card) {
              cardsMap[client._id] = card;
            }
          } catch (error: any) {
            // Solo mostrar error si NO es un 404 (tarjeta no encontrada es normal)
            if (!error.message?.toLowerCase().includes('no encontrada') && 
                !error.message?.toLowerCase().includes('not found')) {
              console.error(`Error cargando tarjeta para cliente ${client._id}:`, error);
            }
            // Si es 404, es normal que no tenga tarjeta, no hacer nada
          }
        }
        setDigitalCards(cardsMap);
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
      toast.error('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCard = async (client: DigitalCardClient) => {
    try {
      setLoading(true);
      setSelectedClient(client);
      
      // Check if we already have the card
      let card = digitalCards[client._id];
      
      if (!card) {
        // Try to get existing card
        card = await digitalCardService.getDigitalCard(client._id);
        
        if (!card) {
          // Generate new card if doesn't exist
          card = await digitalCardService.generateDigitalCard(client._id);
          
          // Si la tarjeta viene con un QR temporal, subirlo a Firebase
          if (card.tempQrCode) {
            try {
              toast.info('Subiendo código QR a la nube...');
              
              // Primero intentar usar el companyId que ya viene en el cliente
              let companyId = (client.branch as any).companyId || '';
              
              // Si no está disponible en el cliente, obtenerlo de la API
              if (!companyId) {
                console.log('CompanyId no disponible en cliente, obteniendo de API...');
                const branchInfo = await branchesService.getBranchById(client.branch._id);
                
                console.log('Branch info completa:', branchInfo.data);
                
                if (branchInfo.data?.companyId) {
                  // Si companyId existe, verificar si es objeto o string
                  if (typeof branchInfo.data.companyId === 'object' && branchInfo.data.companyId !== null) {
                    // Es un objeto poblado, obtener el _id
                    companyId = (branchInfo.data.companyId as any)._id || '';
                    console.log('CompanyId es objeto, _id:', companyId);
                  } else if (typeof branchInfo.data.companyId === 'string') {
                    // Es directamente el string ID
                    companyId = branchInfo.data.companyId;
                    console.log('CompanyId es string:', companyId);
                  }
                }
              } else {
                console.log('Usando companyId del cliente:', companyId);
              }
              
              if (!companyId) {
                console.error('No se pudo obtener companyId. Cliente branch:', client.branch);
                throw new Error('No se pudo determinar la empresa de la sucursal');
              }
              
              console.log('Company ID final para Firebase:', companyId);
              
              // Subir QR a Firebase
              const { url, path } = await uploadDigitalCardQR(
                card.tempQrCode,
                companyId,
                client.branch._id,
                client._id
              );
              
              // Actualizar la tarjeta con las URLs de Firebase
              const updatedCard = await digitalCardService.updateQRUrls(card._id, url, path);
              
              // Actualizar el objeto local
              card = {
                ...updatedCard,
                qrCodeUrl: url,
                qrCodePath: path
              };
              
              // Limpiar el QR temporal
              delete card.tempQrCode;
              delete card.qrCode;
              
              toast.success('Tarjeta digital generada exitosamente');
            } catch (uploadError) {
              console.error('Error subiendo QR a Firebase:', uploadError);
              toast.warning('Tarjeta creada pero hubo un error al subir el QR. Intente regenerarla.');
            }
          }
        }
        
        // Update cards state
        setDigitalCards(prev => ({ ...prev, [client._id]: card }));
      }
      
      setDigitalCard(card);
      setShowCardModal(true);
    } catch (error) {
      console.error('Error generando tarjeta:', error);
      toast.error('Error al generar la tarjeta digital');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (digitalCard) {
      setShowDownloadModal(true);
    }
  };


  const handleScanSuccess = (scanData: any) => {
    // El modal del scanner ya se cierra automáticamente
    // y el dashboard de puntos se abre desde el componente QRScanner
    // Este callback ahora es opcional y puede usarse para actualizar el estado local si es necesario
    console.log('Cliente escaneado:', scanData?.client?.fullName);
  };

  const filteredClients = clients.filter(client => {
    const fullName = `${client.name} ${client.lastName}`.toLowerCase();
    const clientNumber = client.clientNumber.toLowerCase();
    const phone = client.phoneNumber.toLowerCase();
    const term = searchTerm.toLowerCase();
    
    return fullName.includes(term) || 
           clientNumber.includes(term) || 
           phone.includes(term);
  });

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2 className="d-flex align-items-center gap-2">
            <CreditCard size={24} />
            Tarjetas Digitales
          </h2>
          <p className="text-muted">
            Genera y gestiona tarjetas digitales con códigos QR para tus clientes
          </p>
        </Col>
      </Row>

      {/* Barra de búsqueda */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Control
              type="text"
              placeholder="Buscar por nombre, número de cliente o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shadow-sm"
            />
          </Form.Group>
        </Col>
        <Col md={6} className="text-end">
          <Button 
            variant="success" 
            onClick={() => setShowScannerModal(true)}
            disabled={loading}
          >
            <ScanLine size={18} className="me-2" />
            Escanear QR
          </Button>
        </Col>
      </Row>

      {/* Lista de clientes */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando clientes...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <Alert variant="info">
          <Search size={20} className="me-2" />
          {searchTerm ? 'No se encontraron clientes con ese criterio' : 'No hay clientes registrados en esta sucursal'}
        </Alert>
      ) : (
        <Card>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Cliente</th>
                  <th>Número</th>
                  <th>Teléfono</th>
                  <th>Puntos</th>
                  <th className="text-center">Tarjeta Digital</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const card = digitalCards[client._id];
                  return (
                    <tr key={client._id}>
                      <td>
                        <div>
                          <strong>{client.name} {client.lastName}</strong>
                          {client.email && (
                            <div className="small text-muted">{client.email}</div>
                          )}
                        </div>
                      </td>
                      <td>{client.clientNumber}</td>
                      <td>{client.phoneNumber}</td>
                      <td>
                        <span className="badge bg-primary">
                          {client.points} pts
                        </span>
                      </td>
                      <td className="text-center">
                        {card ? (
                          <div>
                            <small className="text-muted d-block">Código:</small>
                            <code className="text-dark">{card.barcode || card.passSerialNumber || 'N/A'}</code>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-center">
                        <Button
                          variant={card ? "outline-primary" : "primary"}
                          size="sm"
                          onClick={() => handleGenerateCard(client)}
                        >
                          <QrCode size={16} className="me-1" />
                          {card ? 'Ver' : 'Crear'} Tarjeta
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Modal de vista previa de tarjeta */}
      <Modal
        show={showCardModal}
        onHide={() => setShowCardModal(false)}
        size="lg"
        centered
        contentClassName="p-0 overflow-hidden border-0"
        dialogClassName="modal-dark-theme"
      >
        <div 
          className="modal-content"
          style={{
            background: 'linear-gradient(to bottom right, rgb(15, 23, 42), rgb(30, 41, 59), rgb(15, 23, 42))',
            borderColor: 'rgb(51, 65, 85)',
            borderRadius: '0.75rem',
            overflow: 'hidden'
          }}
        >
          {/* Custom Header */}
          <div 
            className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom"
            style={{ borderColor: 'rgba(51, 65, 85, 0.5)' }}
          >
            <div className="d-flex align-items-center gap-2">
              <CreditCard size={20} style={{ color: '#06b6d4' }} />
              <h5 className="mb-0 text-white">Tarjeta Digital</h5>
            </div>
            <button 
              type="button"
              className="btn btn-link p-0 text-decoration-none"
              onClick={() => setShowCardModal(false)}
              style={{ color: '#94a3b8' }}
            >
              <X size={20} />
            </button>
          </div>

          <Modal.Body className="p-0">
            {digitalCard && selectedClient && (
              <CardPreview 
                digitalCard={digitalCard} 
                client={selectedClient}
                branch={selectedClient.branch}
              />
            )}
          </Modal.Body>

          {/* Custom Footer */}
          <div 
            className="d-flex gap-3 px-4 py-3 border-top"
            style={{ 
              backgroundColor: 'rgb(15, 23, 42)',
              borderColor: 'rgb(51, 65, 85)'
            }}
          >
            <button 
              className="btn flex-fill border"
              onClick={() => setShowCardModal(false)}
              style={{
                borderColor: 'rgb(71, 85, 105)',
                color: '#cbd5e1',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgb(30, 41, 59)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              Cerrar
            </button>
            <button 
              className="btn flex-fill d-flex align-items-center justify-content-center gap-2"
              onClick={handleDownload}
              style={{
                background: 'linear-gradient(to right, rgb(6, 182, 212), rgb(59, 130, 246))',
                color: 'white',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgba(6, 182, 212, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, rgb(8, 145, 178), rgb(37, 99, 235))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, rgb(6, 182, 212), rgb(59, 130, 246))';
              }}
            >
              <Download size={16} />
              Descargar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de descarga */}
      {digitalCard && (
        <DownloadCard
          show={showDownloadModal}
          onHide={() => setShowDownloadModal(false)}
          card={digitalCard}
          client={selectedClient!}
        />
      )}

      {/* Modal de Scanner QR */}
      <QRScanner
        show={showScannerModal}
        onHide={() => setShowScannerModal(false)}
        onScanSuccess={handleScanSuccess}
        branchId={currentBranchId}
      />

      {/* El modal de puntos ahora se maneja directamente en QRScanner */}
    </Container>
  );
};

export default DigitalCardsPage;