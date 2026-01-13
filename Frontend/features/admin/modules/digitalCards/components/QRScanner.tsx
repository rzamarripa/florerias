"use client";

import { useState, useRef, useCallback } from "react";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";
import { Camera, Upload, X } from "lucide-react";
import QrScanner from "qr-scanner";
import digitalCardService from "../services/digitalCardService";

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
      setError("No se pudo acceder a la cámara");
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

      setScanResult(response.data);
      onScanSuccess(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al procesar el código QR");
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
      setError("No se pudo leer el código QR de la imagen");
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

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Escanear Código QR</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!scanning && !scanResult && (
          <div className="text-center py-4">
            <div className="d-grid gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={startScanner}
                disabled={processing}
              >
                <Camera className="me-2" size={20} />
                Escanear con Cámara
              </Button>

              <Button
                variant="outline-primary"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
              >
                <Upload className="me-2" size={20} />
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
          <div className="position-relative">
            <video
              ref={videoRef}
              style={{ width: "100%", maxHeight: "400px" }}
              className="rounded"
            />
            <Button
              variant="danger"
              className="position-absolute top-0 end-0 m-3"
              onClick={stopScanner}
            >
              <X size={20} />
            </Button>
          </div>
        )}

        {processing && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Procesando código QR...</p>
          </div>
        )}

        {scanResult && (
          <div className="text-center py-4">
            <div className="mb-4">
              <h5>Cliente Escaneado</h5>
              <div className="bg-light rounded p-3 mt-3">
                <p className="mb-2">
                  <strong>Nombre:</strong> {scanResult.client.name}
                </p>
                <p className="mb-2">
                  <strong>Número:</strong> {scanResult.client.clientNumber}
                </p>
                <p className="mb-0">
                  <strong>Puntos:</strong> {scanResult.client.points}
                </p>
              </div>
            </div>

            {scanResult.recentTransactions?.length > 0 && (
              <div className="mt-4">
                <h6>Transacciones Recientes</h6>
                <div className="small text-muted">
                  {scanResult.recentTransactions.map((tx: any, idx: number) => (
                    <div key={idx} className="border-bottom py-2">
                      {tx.description}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cerrar
        </Button>
        {scanResult && (
          <Button variant="primary" onClick={() => handleClose()}>
            Confirmar
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}