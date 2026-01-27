"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, CheckCircle, Loader2 } from "lucide-react";
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
import RewardsSelectionModal from "./RewardsSelectionModal";
import { pointsRewardService } from "../../pointsConfig/services/pointsReward";
import { PointsReward } from "../../pointsConfig/types";

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
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [scannedClientData, setScannedClientData] = useState<any>(null);
  const [availableRewards, setAvailableRewards] = useState<PointsReward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [Html5QrcodeScanner, setHtml5QrcodeScanner] = useState<any>(null);
  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar Html5QrcodeScanner dinámicamente solo en el cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('html5-qrcode').then((module) => {
        setHtml5QrcodeScanner(() => module.Html5QrcodeScanner);
        console.log("Html5QrcodeScanner loaded");
      }).catch((err) => {
        console.error("Error loading Html5QrcodeScanner:", err);
      });
    }
  }, []);

  // Limpiar scanner cuando se cierra el modal o el componente se desmonta
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear().catch((error: any) => {
            console.log("Scanner already cleared");
          });
        } catch (err) {
          console.log("Scanner cleanup skipped");
        }
      }
    };
  }, []);

  const startScanner = async () => {
    if (!Html5QrcodeScanner) {
      toast.error("El escáner aún no está listo. Por favor, intenta de nuevo.");
      return;
    }

    // Verificar si estamos en HTTPS o localhost
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      setError("La cámara solo funciona en conexiones seguras (HTTPS). Por favor, usa HTTPS o localhost.");
      toast.error("Se requiere HTTPS para acceder a la cámara");
      return;
    }

    // Verificar permisos de cámara primero
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log("Solicitando permisos de cámara...");
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        });
        // Detener el stream inmediatamente, solo queríamos verificar permisos
        stream.getTracks().forEach(track => track.stop());
        console.log("Permisos de cámara otorgados");
      }
    } catch (permissionError: any) {
      console.error("Error de permisos:", permissionError);
      if (permissionError.name === 'NotAllowedError') {
        setError("Permisos de cámara denegados. Por favor, permite el acceso a la cámara en la configuración de tu navegador.");
        toast.error("Por favor, permite el acceso a la cámara");
      } else if (permissionError.name === 'NotFoundError') {
        setError("No se encontró ninguna cámara en el dispositivo.");
        toast.error("No se encontró ninguna cámara");
      } else {
        setError(`Error al acceder a la cámara: ${permissionError.message}`);
      }
      return;
    }

    try {
      console.log("Starting Html5QrcodeScanner...");
      setError(null);
      
      // Limpiar scanner anterior si existe
      if (scannerRef.current) {
        try {
          await scannerRef.current.clear();
        } catch (e) {
          console.log("Previous scanner cleared");
        }
        scannerRef.current = null;
      }

      setScanning(true);

      // Esperar un momento para que el DOM se actualice
      await new Promise(resolve => setTimeout(resolve, 100));

      // Configuración del scanner con opciones mejoradas
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: ['QR_CODE'],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        },
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true
      };

      // Crear nuevo scanner
      const scanner = new Html5QrcodeScanner(
        "qr-reader", // ID del elemento HTML
        config,
        false // verbose
      );

      scannerRef.current = scanner;

      // Configurar callbacks
      scanner.render(
        async (decodedText: string, decodedResult: any) => {
          console.log("QR Code scanned:", decodedText);
          
          // Detener el scanner inmediatamente
          if (scannerRef.current) {
            try {
              await scannerRef.current.clear();
            } catch (e) {
              console.log("Scanner clear error:", e);
            }
            scannerRef.current = null;
          }
          
          setScanning(false);
          await handleQRCode(decodedText);
        },
        (errorMessage: string) => {
          // Solo log errores críticos
          if (!errorMessage.includes("NotFoundException") && 
              !errorMessage.includes("No MultiFormat Readers")) {
            console.log("QR scan info:", errorMessage);
          }
        }
      );

      console.log("Scanner started successfully");
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      setError("Error al iniciar el escáner: " + err.message);
      setScanning(false);
      toast.error("Error al iniciar el escáner");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
        scannerRef.current = null;
        console.log("Scanner stopped");
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setScanning(false);
  };

  const handleQRCode = async (qrData: string) => {
    try {
      setProcessing(true);
      
      // Log del QR data para depuración (solo primeros caracteres por seguridad)
      console.log("Procesando QR data:", {
        length: qrData.length,
        preview: qrData.substring(0, 100) + "...",
        startsWithJWT: qrData.startsWith("eyJ") // Los JWT típicamente empiezan con eyJ
      });

      const response = await digitalCardService.scanQRCode(qrData, branchId);

      // Verificar si la respuesta fue exitosa
      if (!response.success || !response.data) {
        const errorMsg = (response as any).message || "Error al procesar el codigo QR";
        console.error("Error en respuesta del servidor:", errorMsg);
        
        // Proporcionar mensajes de error más específicos
        if (errorMsg.includes("inválido") || errorMsg.includes("invalid")) {
          throw new Error("El código QR no es válido o ha expirado. Por favor, solicita uno nuevo.");
        } else if (errorMsg.includes("no encontrada") || errorMsg.includes("not found")) {
          throw new Error("La tarjeta digital no está activa o no existe.");
        } else if (errorMsg.includes("inactiva") || errorMsg.includes("inactive")) {
          throw new Error("La tarjeta digital está inactiva. Por favor, contacta al administrador.");
        } else {
          throw new Error(errorMsg);
        }
      }

      console.log("QR escaneado exitosamente:", {
        clientName: response.data.client.fullName,
        clientNumber: response.data.client.clientNumber,
        points: response.data.client.points
      });

      setScanResult(response.data);
      setScannedClientData(response.data);

      // Mostrar toast de exito
      toast.success(
        `Codigo QR verificado correctamente para ${response.data.client.fullName}`,
        { position: "top-center" }
      );

      // Obtener las recompensas disponibles para el cliente
      try {
        setLoadingRewards(true);
        const rewards = await pointsRewardService.getAvailableRewards(
          response.data.client.id,
          branchId
        );
        setAvailableRewards(rewards);
      } catch (err) {
        console.error("Error obteniendo recompensas:", err);
        setAvailableRewards([]);
      } finally {
        setLoadingRewards(false);
      }

      // Cerrar el modal del scanner y abrir el modal de recompensas despues de un breve delay
      setTimeout(() => {
        setError(null);
        setScanResult(null);
        onHide(); // Cerrar el modal del scanner

        // Luego notificar el exito y abrir el modal de recompensas
        onScanSuccess(response.data);
        setShowRewardsModal(true);
      }, 1500);
    } catch (err: any) {
      console.error("Error procesando código QR:", err);
      const errorMessage = err.message || err.response?.data?.message || "Error al procesar el codigo QR";
      setError(errorMessage);
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 5000,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar el archivo antes de procesarlo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Por favor, selecciona una imagen válida (JPG, PNG, GIF o WebP)");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validar tamaño del archivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("La imagen es demasiado grande. Máximo 10MB");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      setError(null);
      setProcessing(true);

      console.log("Procesando archivo:", {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`
      });

      // Usar qr-scanner que es más robusto para QR codes complejos
      const QrScanner = (await import('qr-scanner')).default;
      
      let decodedText: string | null = null;
      
      try {
        // Intentar con qr-scanner primero (más confiable para QR codes densos)
        console.log("Intentando con qr-scanner...");
        const result = await QrScanner.scanImage(file, {
          returnDetailedScanResult: true,
          alsoTryWithoutScanRegion: true,
        });
        
        if (result && result.data) {
          decodedText = result.data;
          console.log("QR detectado exitosamente con qr-scanner:", decodedText.substring(0, 50) + "...");
        }
      } catch (qrScannerError: any) {
        console.error("qr-scanner falló:", qrScannerError);
        
        // Si qr-scanner falla, intentar con html5-qrcode como fallback
        try {
          console.log("Intentando con html5-qrcode como fallback...");
          const { Html5Qrcode } = await import('html5-qrcode');
          
          // Asegurarse de que el elemento exista
          if (!document.getElementById("qr-reader-file")) {
            const scannerElement = document.createElement('div');
            scannerElement.id = "qr-reader-file";
            scannerElement.style.display = 'none';
            document.body.appendChild(scannerElement);
          }
          
          const html5QrCode = new Html5Qrcode("qr-reader-file");
          
          try {
            // Intentar escanear directamente
            decodedText = await html5QrCode.scanFile(file, false);
            console.log("QR detectado con html5-qrcode");
          } catch (html5Error) {
            console.error("html5-qrcode también falló:", html5Error);
          } finally {
            // Limpiar el escáner
            try {
              await html5QrCode.clear();
            } catch (clearError) {
              console.log("Error al limpiar el escáner:", clearError);
            }
          }
        } catch (fallbackError) {
          console.error("Error con el fallback:", fallbackError);
        }
      }
      
      if (!decodedText) {
        // Si ningún método funcionó, intentar un último intento procesando la imagen
        console.log("Intentando procesar la imagen manualmente...");
        
        const processedResult = await new Promise<string | null>((resolve) => {
          const img = new Image();
          img.onload = async () => {
            try {
              // Crear canvas para procesar la imagen
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              if (!ctx) {
                resolve(null);
                return;
              }
              
              // Escalar la imagen para mejor detección
              const maxSize = 2048;
              let width = img.width;
              let height = img.height;
              
              if (width > maxSize || height > maxSize) {
                const scale = Math.min(maxSize / width, maxSize / height);
                width *= scale;
                height *= scale;
              }
              
              canvas.width = width;
              canvas.height = height;
              
              // Mejorar contraste y brillo
              ctx.filter = 'contrast(2) brightness(1.2)';
              ctx.drawImage(img, 0, 0, width, height);
              
              // Intentar escanear el canvas procesado
              try {
                const processedDataUrl = canvas.toDataURL('image/png');
                const processedBlob = await (await fetch(processedDataUrl)).blob();
                const result = await QrScanner.scanImage(processedBlob, {
                  returnDetailedScanResult: true,
                  alsoTryWithoutScanRegion: true,
                });
                resolve(result?.data || null);
              } catch (e) {
                resolve(null);
              }
            } catch (e) {
              resolve(null);
            }
          };
          
          img.onerror = () => resolve(null);
          img.src = URL.createObjectURL(file);
        });
        
        if (processedResult) {
          decodedText = processedResult;
          console.log("QR detectado después de procesar la imagen");
        }
      }
      
      if (!decodedText) {
        setError("No se pudo leer el código QR. El QR puede ser muy denso o complejo. Intenta usar la cámara o asegúrate de que la imagen sea clara.");
        toast.error("No se pudo detectar el código QR. Intenta con una imagen más clara o usa la cámara", {
          position: "top-center",
          autoClose: 5000,
        });
        return;
      }
      
      console.log("Procesando código QR detectado...");
      await handleQRCode(decodedText);
      
    } catch (err: any) {
      console.error("Error general al procesar archivo:", err);
      setError("Error inesperado al procesar la imagen");
      toast.error("Error al procesar la imagen. Por favor, intenta de nuevo.", {
        position: "top-center",
        autoClose: 5000,
      });
    } finally {
      setProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClose = () => {
    stopScanner();
    setError(null);
    setScanResult(null);
    onHide();
  };

  const handleRewardsModalClose = () => {
    setShowRewardsModal(false);
    setScannedClientData(null);
    setAvailableRewards([]);
  };

  const handleRedeemSuccess = (reward: PointsReward) => {
    // Actualizar los datos del cliente después del canje
    if (scannedClientData) {
      const updatedClientData = {
        ...scannedClientData,
        client: {
          ...scannedClientData.client,
          points: scannedClientData.client.points - reward.pointsRequired,
        }
      };
      setScannedClientData(updatedClientData);
    }
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

          {/* Información de permisos */}
          {!scanning && !scanResult && !error && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-4">
              <p className="text-sm">
                <strong>Nota:</strong> Para escanear códigos QR:
              </p>
              <ul className="text-sm mt-2 ml-4">
                <li>• <strong>Cámara:</strong> Requiere HTTPS o localhost y permisos de cámara</li>
                <li>• <strong>Archivo:</strong> La imagen debe contener un código QR claro y bien enfocado</li>
                <li>• <strong>Formato:</strong> Se aceptan imágenes JPG, PNG, GIF o WebP (máx. 10MB)</li>
                <li>• <strong>Calidad:</strong> Asegúrate de que el QR esté completo y sin distorsión</li>
              </ul>
            </div>
          )}

          {/* Contenedor para el scanner de HTML5 */}
          <div 
            id="qr-reader" 
            style={{ 
              display: scanning ? 'block' : 'none',
              width: '100%'
            }}
          />

          {/* Contenedor oculto para escaneo de archivos */}
          <div id="qr-reader-file" style={{ display: 'none' }} />

          {!scanning && !scanResult && (
            <div className="text-center py-4">
              <div className="grid gap-3">
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => {
                    console.log("Scan button clicked");
                    startScanner();
                  }}
                  disabled={processing || !Html5QrcodeScanner}
                  className="w-full"
                >
                  {!Html5QrcodeScanner ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando escáner...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2" size={20} />
                      Escanear con Cámara
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processing || !Html5QrcodeScanner}
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
            <div className="mt-4 text-center">
              <Button
                variant="destructive"
                onClick={() => {
                  console.log("Stop button clicked");
                  stopScanner();
                }}
              >
                <X size={20} className="mr-2" />
                Detener Escáner
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Apunta la cámara al código QR
              </p>
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

              {availableRewards.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg mb-4">
                  <small>
                    El cliente tiene <strong>{availableRewards.length}</strong> recompensa(s) disponible(s)
                  </small>
                </div>
              )}

              {loadingRewards && (
                <div className="text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Cargando recompensas disponibles...
                </div>
              )}

              {!loadingRewards && (
                <div className="text-muted-foreground text-sm">
                  Abriendo catálogo de recompensas...
                </div>
              )}
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

    {/* Modal de Recompensas */}
    {scannedClientData && (
      <RewardsSelectionModal
        show={showRewardsModal}
        onHide={handleRewardsModalClose}
        client={scannedClientData.client}
        rewards={availableRewards}
        branchId={branchId}
        onRedeemSuccess={handleRedeemSuccess}
      />
    )}
    </>
  );
}