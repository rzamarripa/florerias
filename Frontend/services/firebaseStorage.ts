import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

export interface UploadFileResult {
  url: string;
  path: string;
}

/**
 * Sube un archivo a Firebase Storage
 * Usa uploadBytes directamente del SDK de Firebase
 */
export const uploadFile = async (
  file: File,
  folder: string
): Promise<UploadFileResult> => {
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
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Error al eliminar archivo de Firebase Storage:", error);
    throw new Error("Error al eliminar el archivo.");
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
  const folder = `ecommerce/empresas/${companyId}/sucursales/${branchId}/imagenes`;
  return uploadFile(file, folder);
};
