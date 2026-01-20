import { storage as firebaseStorage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject, getStorage } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { getApp } from "firebase/app";

export interface UploadFileResult {
  url: string;
  path: string;
}

/**
 * Obtiene una instancia de Firebase Storage, inicializándola si es necesario
 */
const getStorageInstance = () => {
  if (firebaseStorage) {
    return firebaseStorage;
  }
  
  // Si storage es null, intentar obtenerlo nuevamente
  try {
    const app = getApp();
    return getStorage(app);
  } catch (error) {
    console.error("Error obteniendo Firebase Storage:", error);
    throw new Error("No se pudo inicializar Firebase Storage");
  }
};

/**
 * Sube un archivo a Firebase Storage
 * Usa uploadBytes directamente del SDK de Firebase
 */
export const uploadFile = async (
  file: File,
  folder: string
): Promise<UploadFileResult> => {
  const storage = getStorageInstance();

  const fileExtension = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const filePath = `${folder}/${fileName}`;
  const storageRef = ref(storage, filePath);

  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  return {
    url: downloadURL,
    path: filePath,
  };
};

/**
 * Elimina un archivo de Firebase Storage
 * @param filePath - La ruta del archivo a eliminar
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const storage = getStorageInstance();
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Error al eliminar archivo de Firebase Storage:", error);
    // No lanzar error, solo loggear
    console.warn("No se pudo eliminar el archivo:", filePath);
  }
};

/**
 * Sube el comprobante de una orden
 * @param file - El archivo de comprobante
 * @param companyId - El ID de la empresa
 * @param branchId - El ID de la sucursal
 * @param orderId - El ID de la orden
 * @returns URL de descarga del comprobante
 */
export const uploadComprobante = async (
  file: File,
  companyId: string,
  branchId: string,
  orderId: string
): Promise<UploadFileResult> => {
  const folder = `Empresas/${companyId}/branches/${branchId}/orders/${orderId}/comprobantes`;
  return uploadFile(file, folder);
};

/**
 * Sube la imagen del arreglo de una orden
 * @param file - El archivo de la imagen del arreglo
 * @param companyId - El ID de la empresa
 * @param branchId - El ID de la sucursal
 * @param orderId - El ID de la orden
 * @returns URL de descarga de la imagen del arreglo
 */
export const uploadArreglo = async (
  file: File,
  companyId: string,
  branchId: string,
  orderId: string
): Promise<UploadFileResult> => {
  const folder = `Empresas/${companyId}/branches/${branchId}/orders/${orderId}/arreglos`;
  return uploadFile(file, folder);
};

/**
 * Sube el logo de una empresa
 * @param file - El archivo del logo
 * @param companyId - El ID de la empresa (para organizar los archivos)
 * @returns URL de descarga del logo
 */
export const uploadCompanyLogo = async (
  file: File,
  companyId: string
): Promise<UploadFileResult> => {
  const folder = `Empresas/${companyId}/logo`;
  return uploadFile(file, folder);
};

/**
 * Sube el logo del e-commerce
 * @param file - El archivo del logo
 * @param companyId - El ID de la empresa
 * @param branchId - El ID de la sucursal
 * @returns URL de descarga del logo
 */
export const uploadEcommerceLogo = async (
  file: File,
  companyId: string,
  branchId: string
): Promise<UploadFileResult> => {
  const folder = `ecommerce/empresas/${companyId}/sucursales/${branchId}/logo`;
  return uploadFile(file, folder);
};

/**
 * Sube la portada del e-commerce
 * @param file - El archivo de la portada
 * @param companyId - El ID de la empresa
 * @param branchId - El ID de la sucursal
 * @returns URL de descarga de la portada
 */
export const uploadEcommerceCover = async (
  file: File,
  companyId: string,
  branchId: string
): Promise<UploadFileResult> => {
  const folder = `ecommerce/empresas/${companyId}/sucursales/${branchId}/portada`;
  return uploadFile(file, folder);
};

/**
 * Sube el banner del e-commerce
 * @param file - El archivo del banner
 * @param companyId - El ID de la empresa
 * @param branchId - El ID de la sucursal
 * @returns URL de descarga del banner
 */
export const uploadEcommerceBanner = async (
  file: File,
  companyId: string,
  branchId: string
): Promise<UploadFileResult> => {
  const folder = `ecommerce/empresas/${companyId}/sucursales/${branchId}/banner`;
  return uploadFile(file, folder);
};

/**
 * Sube una imagen del carrusel del e-commerce
 * @param file - El archivo de la imagen
 * @param companyId - El ID de la empresa
 * @param branchId - El ID de la sucursal
 * @param index - El índice de la imagen en el carrusel
 * @returns URL de descarga de la imagen
 */
export const uploadEcommerceCarouselImage = async (
  file: File,
  companyId: string,
  branchId: string,
  index: number
): Promise<UploadFileResult> => {
  const folder = `ecommerce/empresas/${companyId}/sucursales/${branchId}/carrusel`;
  return uploadFile(file, folder);
};

/**
 * Sube el código QR de una tarjeta digital a Firebase Storage
 * @param qrBase64 - El código QR en formato base64
 * @param companyId - El ID de la empresa
 * @param branchId - El ID de la sucursal
 * @param clientId - El ID del cliente
 * @returns URL de descarga del QR y path en Firebase
 */
export const uploadDigitalCardQR = async (
  qrBase64: string,
  companyId: string,
  branchId: string,
  clientId: string
): Promise<UploadFileResult> => {
  // Remover el prefijo data:image/png;base64, si existe
  const base64Data = qrBase64.replace(/^data:image\/\w+;base64,/, '');
  
  // Convertir base64 a Blob
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/png' });
  
  // Crear un File object desde el Blob
  const file = new File([blob], 'qr-code.png', { type: 'image/png' });
  
  // Definir la carpeta de destino
  const folder = `Empresas/${companyId}/branches/${branchId}/clients/${clientId}/tarjeta`;
  
  // Subir el archivo a Firebase
  return uploadFile(file, folder);
};

/**
 * Sube la imagen hero de una tarjeta digital a Firebase Storage
 * @param file - El archivo de imagen hero
 * @param companyId - El ID de la empresa
 * @param branchId - El ID de la sucursal
 * @param clientId - El ID del cliente
 * @returns URL de descarga de la imagen y path en Firebase
 */
export const uploadDigitalCardHero = async (
  file: File,
  companyId: string,
  branchId: string,
  clientId: string
): Promise<UploadFileResult> => {
  // Definir la carpeta de destino (al mismo nivel que tarjeta)
  const folder = `Empresas/${companyId}/branches/${branchId}/clients/${clientId}/hero_cards`;
  
  // Subir el archivo a Firebase
  return uploadFile(file, folder);
};