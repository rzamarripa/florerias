"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, X, CheckCircle, Loader2 } from "lucide-react";
import QrScanner from "qr-scanner";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import digitalCardService from "../services/digitalCardService";
import ClientPointsDashboardModal from "../../clients/components/ClientPointsDashboardModal";

interface QRScannerProps {
  show: boolean;
  onHide: () => void;
  onScanSuccess: (data: any) => void;
  branchId: string;
}

export default function QRScanner({ show, onHide, onScanSuccess, branchId }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [showPointsDashboard, setShowPointsDashboard] = useState(false);
  const [scannedClientData, setScannedClientData] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      setError(null);
      setScanning(true);

      scannerRef.current = new QrScanner(
        videoRef.current,
        async (result) => {
          await handleQRCode(result.data);
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      await scannerRef.current.start();
    } catch (err) {
      setError("No se pudo acceder a la camara");
      setScanning(false);
    }
  }, []);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const handleQRCode = async (qrData: string) => {
    try {
      setProcessing(true);
      stopScanner();

      const response = await digitalCardService.scanQRCode(qrData, branchId);

      // Verificar si la respuesta fue exitosa
      if (!response.success || !response.data) {
        throw new Error((response as any).message || "Error al procesar el codigo QR");
      }

      setScanResult(response.data);
      setScannedClientData(response.data);

      // Mostrar toast de exito
      toast.success(
        `Codigo QR verificado correctamente para ${response.data.client.fullName}`,
        { position: "top-center" }
      );

      // Cerrar el modal del scanner y abrir el dashboard despues de un breve delay
      setTimeout(() => {
        // Primero cerrar el scanner
        stopScanner();
        setError(null);
        setScanResult(null);
        onHide(); // Cerrar el modal del scanner

        // Luego notificar el exito y abrir el dashboard
        onScanSuccess(response.data);
        setShowPointsDashboard(true);
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.message || err.response?.data?.message || "Error al procesar el codigo QR";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setProcessing(true);

      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
      });

      await handleQRCode(result.data);
    } catch (err) {
      setError("No se pudo leer el codigo QR de la imagen");
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    stopScanner();
    setError(null);
    setScanResult(null);
    onHide();
  };

  const handlePointsDashboardClose = () => {
    setShowPointsDashboard(false);
    setScannedClientData(null);
  };

  return (
    <>
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Escanear Codigo QR</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {!scanning && !scanResult && (
            <div className="text-center py-4">
              <div className="grid gap-3">
                <Button
                  variant="default"
                  size="lg"
                  onClick={startScanner}
                  disabled={processing}
                  className="w-full"
                >
                  <Camera className="mr-2" size={20} />
                  Escanear con Camara
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processing}
                  className="w-full"
                >
                  <Upload className="mr-2" size={20} />
                  Subir Imagen con QR
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          )}

          {scanning && (
            <div className="relative">
              <video
                ref={videoRef}
                style={{ width: "100%", maxHeight: "400px" }}
                className="rounded-lg"
              />
              <Button
                variant="destructive"
                className="absolute top-0 right-0 m-3"
                onClick={stopScanner}
              >
                <X size={20} />
              </Button>
            </div>
          )}

          {processing && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-3 text-muted-foreground">Procesando codigo QR...</p>
            </div>
          )}

          {scanResult && (
            <div className="text-center py-4">
              <CheckCircle size={64} className="text-green-500 mb-3 mx-auto" />
              <div className="mb-4">
                <h5 className="text-green-600 font-semibold text-lg">Codigo QR Verificado!</h5>
                <div className="bg-muted rounded-lg p-4 mt-3">
                  <p className="mb-2">
                    <strong>Cliente:</strong> {scanResult.client.fullName}
                  </p>
                  <p className="mb-2">
                    <strong>Numero:</strong> {scanResult.client.clientNumber}
                  </p>
                  <p className="mb-0">
                    <strong>Puntos Disponibles:</strong>{" "}
                    <span className="text-primary font-bold">{scanResult.client.points}</span>
                  </p>
                </div>
              </div>

              {scanResult.rewards?.available > 0 && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg mb-4">
                  <small>
                    El cliente tiene <strong>{scanResult.rewards.available}</strong> recompensa(s) disponible(s)
                  </small>
                </div>
              )}

              <div className="text-muted-foreground text-sm">
                Abriendo dashboard de puntos...
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cerrar
          </Button>
          {scanResult && (
            <Button variant="default" onClick={() => handleClose()}>
              Confirmar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal del Dashboard de Puntos */}
    {scannedClientData && (
      <ClientPointsDashboardModal
        show={showPointsDashboard}
        onHide={handlePointsDashboardClose}
        client={{
          _id: scannedClientData.client.id,
          name: scannedClientData.client.name,
          lastName: scannedClientData.client.lastName,
          clientNumber: scannedClientData.client.clientNumber,
          phoneNumber: scannedClientData.client.phoneNumber,
          email: scannedClientData.client.email,
          points: scannedClientData.client.points,
          status: scannedClientData.client.status,
        }}
        branchId={branchId}
      />
    )}
    </>
  );
}
