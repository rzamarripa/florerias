import { apiCall } from '@/utils/api';

export interface DigitalCard {
  _id: string;
  clientId: string | Client;
  passSerialNumber: string;
  passTypeId?: string;
  googleWalletId?: string;
  qrCode: string; // Base64
  qrData: string;
  barcode?: string;
  cardType: 'apple' | 'google' | 'generic';
  lastPointsBalance: number;
  lastUpdated: Date;
  pushToken?: {
    apple?: string;
    google?: string;
  };
  passUrl?: {
    apple?: string;
    google?: string;
  };
  downloads: number;
  lastDownloadedAt?: Date;
  isActive: boolean;
  expiresAt: Date;
  metadata: {
    backgroundColor: string;
    foregroundColor: string;
    labelColor: string;
    logoText: string;
  };
  branchId: string | Branch;
  rotationSchedule: {
    enabled: boolean;
    intervalDays: number;
    lastRotation: Date;
    nextRotation: Date;
  };
  devices: Array<{
    deviceId: string;
    deviceType: 'ios' | 'android' | 'web';
    registeredAt: Date;
    lastAccess: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardTransaction {
  _id: string;
  digitalCardId: string;
  clientId: string;
  transactionType: string;
  scanMethod?: string;
  pointsInvolved: number;
  balanceBefore: number;
  balanceAfter: number;
  rewardId?: string;
  orderId?: string;
  locationData: {
    branchId: string;
    terminalId?: string;
    employeeId?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  deviceInfo: {
    deviceId?: string;
    deviceType?: string;
    appVersion?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  status: 'success' | 'failed' | 'pending';
  errorMessage?: string;
  notes?: string;
  processedAt: Date;
  createdAt: Date;
}

export interface ScanResult {
  success: boolean;
  data?: {
    client: {
      id: string;
      name: string;
      lastName: string;
      fullName: string;
      clientNumber: string;
      phoneNumber: string;
      email: string;
      points: number;
      status: boolean;
    };
    branch: {
      id: string;
      name: string;
    };
    digitalCard: {
      id: string;
      lastUpdated: Date;
      isActive: boolean;
    };
    rewards: {
      available: number;
      list: Array<{
        id: string;
        rewardId: string;
        name: string;
        code: string;
        pointsRequired: number;
        rewardType: string;
        rewardValue: number;
        isPercentage: boolean;
      }>;
    };
    scanTime: Date;
  };
}

interface Client {
  _id: string;
  name: string;
  lastName: string;
  clientNumber: string;
  phoneNumber: string;
  email?: string;
  points: number;
}

interface Branch {
  _id: string;
  name: string;
  address?: string;
}

class DigitalCardService {
  /**
   * Genera o obtiene la tarjeta digital de un cliente
   */
  async generateDigitalCard(clientId: string, cardType: string = 'generic'): Promise<DigitalCard> {
    const response = await apiCall<DigitalCard>(`/digital-cards/generate/${clientId}`, {
      method: 'POST',
      body: JSON.stringify({ cardType }),
    });
    return response.data;
  }

  /**
   * Obtiene la tarjeta digital de un cliente
   */
  async getDigitalCard(clientId: string): Promise<DigitalCard | null> {
    try {
      const response = await apiCall<DigitalCard>(`/digital-cards/client/${clientId}`);
      return response.data;
    } catch (error: any) {
      if (error.message?.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Descarga la tarjeta en formato Apple Wallet
   */
  async downloadAppleWallet(cardId: string): Promise<Blob> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/digital-cards/download/apple/${cardId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Error descargando Apple Wallet');
    }
    
    return response.blob();
  }

  /**
   * Actualiza los puntos en la tarjeta digital
   */
  async updateCardPoints(cardId: string, points: number, reason?: string): Promise<any> {
    const response = await apiCall<any>(`/digital-cards/update-points/${cardId}`, {
      method: 'PUT',
      body: JSON.stringify({ points, reason }),
    });
    return response.data;
  }

  /**
   * Obtiene las transacciones de una tarjeta
   */
  async getCardTransactions(
    cardId: string,
    params?: {
      limit?: number;
      skip?: number;
      type?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ transactions: CardTransaction[]; pagination: any }> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const response = await apiCall<CardTransaction[]>(`/digital-cards/transactions/${cardId}${queryString}`);
    return {
      transactions: response.data,
      pagination: response.pagination,
    };
  }

  /**
   * Obtiene estadísticas de uso de la tarjeta
   */
  async getCardStatistics(cardId: string): Promise<any> {
    const response = await apiCall<any>(`/digital-cards/statistics/${cardId}`);
    return response.data;
  }

  /**
   * Desactiva una tarjeta digital
   */
  async deactivateCard(cardId: string, reason?: string): Promise<void> {
    await apiCall<void>(`/digital-cards/deactivate/${cardId}`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  /**
   * Genera un QR temporal para una transacción
   */
  async generateTemporaryQR(
    clientId: string,
    type: string,
    data: any
  ): Promise<{ qrCode: string; token: string; expiresIn: number }> {
    const response = await apiCall<{ qrCode: string; token: string; expiresIn: number }>(
      `/digital-cards/temporary-qr/${clientId}`,
      {
        method: 'POST',
        body: JSON.stringify({ type, data }),
      }
    );
    return response.data;
  }

  /**
   * Obtiene todas las tarjetas de una sucursal
   */
  async getCardsByBranch(
    branchId: string,
    params?: {
      page?: number;
      limit?: number;
      isActive?: boolean;
    }
  ): Promise<{ cards: DigitalCard[]; pagination: any }> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const response = await apiCall<DigitalCard[]>(`/digital-cards/branch/${branchId}${queryString}`);
    return {
      cards: response.data,
      pagination: response.pagination,
    };
  }

  /**
   * Escanea un código QR
   */
  async scanQRCode(
    qrData: string,
    branchId: string,
    additionalData?: {
      employeeId?: string;
      terminalId?: string;
      deviceInfo?: any;
    }
  ): Promise<ScanResult> {
    const response = await apiCall<ScanResult>('/scanner/scan', {
      method: 'POST',
      body: JSON.stringify({
        qrData,
        branchId,
        ...additionalData,
      }),
    });
    return response;
  }

  /**
   * Procesa una transacción de puntos
   */
  async processPointsTransaction(data: {
    clientId: string;
    orderId?: string;
    points: number;
    type: 'earn' | 'redeem';
    branchId: string;
    employeeId?: string;
    reason?: string;
  }): Promise<any> {
    const response = await apiCall<any>('/scanner/points-transaction', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Procesa el canje de una recompensa
   */
  async processRewardRedemption(data: {
    clientId: string;
    rewardId: string;
    branchId: string;
    employeeId?: string;
  }): Promise<any> {
    const response = await apiCall<any>('/scanner/redeem-reward', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Valida un QR temporal
   */
  async validateTemporaryQR(qrData: string): Promise<any> {
    const response = await apiCall<any>('/scanner/validate-temporary', {
      method: 'POST',
      body: JSON.stringify({ qrData }),
    });
    return response.data;
  }

  /**
   * Obtiene el historial de escaneos de un cliente
   */
  async getScanHistory(
    clientId: string,
    params?: {
      limit?: number;
      skip?: number;
      branchId?: string;
    }
  ): Promise<{ scans: any[]; pagination: any }> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const response = await apiCall<any[]>(`/scanner/history/${clientId}${queryString}`);
    return {
      scans: response.data,
      pagination: response.pagination,
    };
  }

  /**
   * Usa una recompensa en una orden
   */
  async useRewardInOrder(data: {
    clientId: string;
    rewardCode: string;
    orderId: string;
    branchId: string;
    employeeId?: string;
  }): Promise<any> {
    const response = await apiCall<any>('/scanner/use-reward', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Genera un enlace para compartir la tarjeta
   */
  generateShareLink(cardId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/digital-card/view/${cardId}`;
  }

  /**
   * Descarga el QR como imagen
   */
  downloadQRImage(qrCodeBase64: string, filename: string = 'qr-code.png'): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = qrCodeBase64;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Verifica si el navegador soporta Apple Wallet
   */
  isAppleWalletSupported(): boolean {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes('iphone') || userAgent.includes('ipad');
  }

  /**
   * Verifica si el navegador soporta Google Wallet
   */
  isGoogleWalletSupported(): boolean {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes('android');
  }

  /**
   * Formatea la fecha de expiración
   */
  formatExpirationDate(date: Date | string): string {
    const expDate = new Date(date);
    return expDate.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Calcula el nivel del cliente basado en puntos
   */
  getClientLevel(points: number): { name: string; color: string; nextLevel: number } {
    if (points >= 1000) {
      return { name: 'Oro', color: '#FFD700', nextLevel: 0 };
    }
    if (points >= 500) {
      return { name: 'Plata', color: '#C0C0C0', nextLevel: 1000 };
    }
    if (points >= 100) {
      return { name: 'Bronce', color: '#CD7F32', nextLevel: 500 };
    }
    return { name: 'Inicial', color: '#8B5CF6', nextLevel: 100 };
  }
}

export default new DigitalCardService();