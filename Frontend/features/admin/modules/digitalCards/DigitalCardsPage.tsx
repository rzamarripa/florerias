import React, { useState, useEffect } from 'react';
import { CreditCard, Download, QrCode, Search, ScanLine, X, Loader2, Image as ImageIcon, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import CardPreview from './components/CardPreview';
import DownloadCard from './components/DownloadCard';
import QRScanner from './components/QRScanner';
import digitalCardService from './services/digitalCardService';
import { clientsService } from '../clients/services/clients';
import { branchesService } from '../branches/services/branches';
import { companiesService } from '../companies/services/companies';
import { uploadDigitalCardQR, uploadDigitalCardHero } from '@/services/firebaseStorage';
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
  const [companyId, setCompanyId] = useState<string>('');
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string>('');
  const [uploadingHero, setUploadingHero] = useState(false);

  const { user } = useUserSessionStore();
  const { hasRole } = useUserRoleStore();
  const { activeBranch } = useActiveBranchStore();
  const isManager = hasRole('Gerente');
  const isAdmin = hasRole('Administrador') || hasRole('Admin') || hasRole('Super Admin');

  useEffect(() => {
    loadCompanyAndClients();
  }, [user, activeBranch]);

  const loadCompanyAndClients = async () => {
    try {
      setLoading(true);

      let currentCompanyId = '';
      let currentBranchId = '';

      // Para Gerentes: obtener empresa a través de su sucursal
      if (isManager && user?._id) {
        try {
          const branchesResponse = await branchesService.getUserBranches();
          if (branchesResponse.success && branchesResponse.data && branchesResponse.data.length > 0) {
            const branch = branchesResponse.data[0];
            currentBranchId = branch._id;
            
            // Obtener la empresa a través de la sucursal
            const companyResponse = await companiesService.getCompanyByBranchId(branch._id);
            if (companyResponse.success && companyResponse.data) {
              currentCompanyId = companyResponse.data.companyId;
            }
          } else {
            toast.error('No se encontró una sucursal asignada para el gerente');
            return;
          }
        } catch (error) {
          console.error('Error al cargar sucursal del gerente:', error);
          toast.error('Error al cargar la sucursal del gerente');
          return;
        }
      }
      // Para Administradores: obtener empresa directamente
      else if (isAdmin && user?._id) {
        try {
          const companyResponse = await companiesService.getCompanyByAdministratorId(user._id);
          if (companyResponse.success && companyResponse.data) {
            currentCompanyId = companyResponse.data._id;
          }
          
          // Si hay sucursal activa, usarla
          if (activeBranch) {
            currentBranchId = activeBranch._id;
          }
        } catch (error) {
          console.error('Error al cargar empresa del administrador:', error);
          toast.error('Error al cargar la empresa del administrador');
          return;
        }
      }

      if (!currentCompanyId) {
        toast.warning('No se pudo determinar la empresa');
        return;
      }

      setCompanyId(currentCompanyId);
      if (currentBranchId) {
        setCurrentBranchId(currentBranchId);
      }

      // Cargar clientes de la empresa
      const response = await clientsService.getAllClients({
        companyId: currentCompanyId,
        limit: 100
      });

      if (response.success && response.data) {
        // Para los clientes, crear un objeto branch simplificado con el companyId
        const clientsWithCompany = response.data.map((client: any) => ({
          ...client,
          branch: {
            _id: currentBranchId || 'N/A',
            name: activeBranch?.branchName || 'Empresa',
            address: '',
            companyId: currentCompanyId
          }
        }));

        setClients(clientsWithCompany);

        // Load digital cards for all clients
        const cardsMap: Record<string, any> = {};
        for (const client of clientsWithCompany) {
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

  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeroImageFile(file);
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadHeroImage = async () => {
    if (!heroImageFile || !digitalCard || !selectedClient) {
      toast.error('Falta información necesaria para subir la imagen');
      return;
    }

    try {
      setUploadingHero(true);

      // Obtener companyId
      let companyId = '';
      if (selectedClient.branch && typeof selectedClient.branch === 'object' && 'companyId' in selectedClient.branch) {
        companyId = (selectedClient.branch as any).companyId;
      } else {
        const branchInfo = await branchesService.getBranchById(selectedClient.branch._id);
        if (branchInfo.data?.companyId) {
          if (typeof branchInfo.data.companyId === 'object' && branchInfo.data.companyId !== null) {
            companyId = (branchInfo.data.companyId as any)._id || '';
          } else if (typeof branchInfo.data.companyId === 'string') {
            companyId = branchInfo.data.companyId;
          }
        }
      }

      if (!companyId) {
        throw new Error('No se pudo determinar la empresa');
      }

      // Subir imagen hero a Firebase
      const heroResult = await uploadDigitalCardHero(
        heroImageFile,
        companyId,
        selectedClient.branch._id,
        selectedClient._id
      );

      // Actualizar la tarjeta con las URLs de la imagen hero
      const updatedCard = await digitalCardService.updateHeroUrls(
        digitalCard._id,
        heroResult.url,
        heroResult.path
      );

      // Actualizar el estado local
      setDigitalCard({
        ...digitalCard,
        heroUrl: heroResult.url,
        heroPath: heroResult.path
      });

      // Actualizar el estado de tarjetas digitales
      setDigitalCards(prev => ({
        ...prev,
        [selectedClient._id]: {
          ...prev[selectedClient._id],
          heroUrl: heroResult.url,
          heroPath: heroResult.path
        }
      }));

      toast.success('Imagen decorativa subida exitosamente');
      
      // Limpiar el estado del archivo
      setHeroImageFile(null);
      setHeroImagePreview('');
    } catch (error) {
      console.error('Error subiendo imagen hero:', error);
      toast.error('No se pudo subir la imagen decorativa');
    } finally {
      setUploadingHero(false);
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
              toast.info('Subiendo codigo QR a la nube...');

              // Primero intentar usar el companyId que ya viene en el cliente
              let companyId = (client.branch as any).companyId || '';

              // Si no esta disponible en el cliente, obtenerlo de la API
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
    // El modal del scanner ya se cierra automaticamente
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
    <div className="container-fluid px-4">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-semibold">
          <CreditCard size={24} />
          Tarjetas Digitales
        </h2>
        <p className="text-muted-foreground">
          Genera y gestiona tarjetas digitales con codigos QR para tus clientes
        </p>
      </div>

      {/* Barra de busqueda */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Input
            type="text"
            placeholder="Buscar por nombre, numero de cliente o telefono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="shadow-sm"
          />
        </div>
        <div className="flex justify-end">
          <Button
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setShowScannerModal(true)}
            disabled={loading}
          >
            <ScanLine size={18} className="mr-2" />
            Escanear QR
          </Button>
        </div>
      </div>

      {/* Lista de clientes */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-3 text-muted-foreground">Cargando clientes...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <Search size={20} />
          {searchTerm ? 'No se encontraron clientes con ese criterio' : 'No hay clientes registrados en esta empresa'}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Numero</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Puntos</TableHead>
                  <TableHead className="text-center">Tarjeta Digital</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const card = digitalCards[client._id];
                  return (
                    <TableRow key={client._id}>
                      <TableCell>
                        <div>
                          <strong>{client.name} {client.lastName}</strong>
                          {client.email && (
                            <div className="text-sm text-muted-foreground">{client.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{client.clientNumber}</TableCell>
                      <TableCell>{client.phoneNumber}</TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {client.points} pts
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {card ? (
                          <div>
                            <small className="text-muted-foreground block">Codigo:</small>
                            <code className="text-foreground">{card.barcode || card.passSerialNumber || 'N/A'}</code>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant={card ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleGenerateCard(client)}
                        >
                          <QrCode size={16} className="mr-1" />
                          {card ? 'Ver' : 'Crear'} Tarjeta
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal de vista previa de tarjeta */}
      <Dialog open={showCardModal} onOpenChange={setShowCardModal}>
        <DialogContent
          className="max-w-3xl p-0 overflow-hidden"
          style={{
            background: 'linear-gradient(to bottom right, rgb(15, 23, 42), rgb(30, 41, 59), rgb(15, 23, 42))',
            borderColor: 'rgb(51, 65, 85)',
            borderRadius: '0.75rem',
          }}
        >
          {/* Custom Header */}
          <DialogHeader
            className="flex flex-row items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'rgba(51, 65, 85, 0.5)' }}
          >
            <div className="flex items-center gap-2">
              <CreditCard size={20} style={{ color: '#06b6d4' }} />
              <DialogTitle className="text-white">Tarjeta Digital</DialogTitle>
            </div>
            <button
              type="button"
              className="p-0 hover:opacity-80 transition-opacity"
              onClick={() => setShowCardModal(false)}
              style={{ color: '#94a3b8' }}
            >
              <X size={20} />
            </button>
          </DialogHeader>

          <div className="p-0">
            {digitalCard && selectedClient && (
              <CardPreview
                digitalCard={digitalCard}
                client={selectedClient}
                branch={selectedClient.branch}
              />
            )}
          </div>

          {/* Sección para subir imagen hero */}
          <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(51, 65, 85, 0.5)' }}>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white mb-1 flex items-center gap-2">
                  <ImageIcon size={16} style={{ color: '#06b6d4' }} />
                  Imagen Decorativa
                </h4>
                <p className="text-xs text-gray-400 mb-2">
                  Personaliza la tarjeta con una imagen en la parte inferior
                </p>
                <div className="flex items-center gap-3">
                  <label 
                    htmlFor="hero-image-modal"
                    className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors"
                    style={{
                      backgroundColor: 'rgba(6, 182, 212, 0.1)',
                      color: '#06b6d4',
                      border: '1px solid rgba(6, 182, 212, 0.3)'
                    }}
                  >
                    <Upload size={14} />
                    Seleccionar Imagen
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageChange}
                    className="hidden"
                    id="hero-image-modal"
                  />
                  {heroImageFile && (
                    <Badge variant="secondary" className="text-xs">
                      {heroImageFile.name}
                    </Badge>
                  )}
                  {heroImageFile && (
                    <Button
                      size="sm"
                      onClick={handleUploadHeroImage}
                      disabled={uploadingHero}
                      className="h-7 px-3 text-xs"
                      style={{
                        background: uploadingHero ? 'gray' : 'linear-gradient(to right, rgb(6, 182, 212), rgb(59, 130, 246))'
                      }}
                    >
                      {uploadingHero ? (
                        <>
                          <Loader2 className="animate-spin mr-1" size={12} />
                          Subiendo...
                        </>
                      ) : (
                        'Aplicar Imagen'
                      )}
                    </Button>
                  )}
                </div>
              </div>
              {heroImagePreview && (
                <div className="w-24 h-16 rounded-md overflow-hidden border" style={{ borderColor: 'rgba(51, 65, 85, 0.5)' }}>
                  <img 
                    src={heroImagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Custom Footer */}
          <DialogFooter
            className="flex gap-3 px-4 py-3 border-t"
            style={{
              backgroundColor: 'rgb(15, 23, 42)',
              borderColor: 'rgb(51, 65, 85)'
            }}
          >
            <Button
              variant="outline"
              className="flex-1 border"
              onClick={() => setShowCardModal(false)}
              style={{
                borderColor: 'rgb(71, 85, 105)',
                color: '#cbd5e1',
                backgroundColor: 'transparent'
              }}
            >
              Cerrar
            </Button>
            <Button
              className="flex-1 flex items-center justify-center gap-2"
              onClick={handleDownload}
              style={{
                background: 'linear-gradient(to right, rgb(6, 182, 212), rgb(59, 130, 246))',
                color: 'white',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgba(6, 182, 212, 0.2)'
              }}
            >
              <Download size={16} />
              Descargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de descarga */}
      {digitalCard && (
        <DownloadCard
          show={showDownloadModal}
          onHide={() => setShowDownloadModal(false)}
          card={digitalCard}
          client={selectedClient!}
          onDownloadApple={async () => {
            try {
              // Usar la URL del API correcta para Next.js
              const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3005';
              const response = await fetch(
                `${apiUrl}/api/digital-cards/download/apple/${digitalCard._id}`
              );
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al descargar Apple Wallet Pass');
              }
              
              // Descargar el archivo .pkpass
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${selectedClient?.clientNumber || 'card'}.pkpass`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
              
              toast.success('Apple Wallet Pass descargado correctamente');
            } catch (error: any) {
              console.error('Error descargando Apple Wallet:', error);
              toast.error(error.message || 'Error al descargar Apple Wallet Pass');
            }
          }}
          onDownloadGoogle={async () => {
            try {
              // Usar la URL del API correcta para Next.js
              const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3005';
              const response = await fetch(
                `${apiUrl}/api/digital-cards/download/google/${digitalCard._id}`
              );
              const data = await response.json();
              
              if (data.success) {
                if (data.saveUrl) {
                  // Abrir URL de Google Wallet en nueva pestaña
                  window.open(data.saveUrl, '_blank');
                  toast.success('Abriendo Google Wallet...');
                } else if (data.isDevelopment) {
                  toast.info('Modo desarrollo: Configure las credenciales de Google Wallet');
                  console.log('Instrucciones:', data.data?.instructions);
                }
              } else {
                toast.error('Error al generar tarjeta para Google Wallet');
              }
            } catch (error) {
              console.error('Error:', error);
              toast.error('Error al conectar con el servidor');
            }
          }}
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
    </div>
  );
};

export default DigitalCardsPage;
