import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

export interface UploadFileResult {
  url: string;
  path: string;
}

/**
 * Sube un archivo a Firebase Storage
 * @param file - El archivo a subir
 * @param folder - La carpeta donde se guardará el archivo (ej: 'comprobantes', 'arreglos')
 * @returns Objeto con la URL de descarga y la ruta del archivo
 */
export const uploadFile = async (
  file: File,
  folder: string
): Promise<UploadFileResult> => {
  try {
    // Generar un nombre único para el archivo
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    // Crear referencia al archivo en Storage
    const storageRef = ref(storage, filePath);

    // Subir el archivo
    const snapshot = await uploadBytes(storageRef, file);

    // Obtener la URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      url: downloadURL,
      path: filePath,
    };
  } catch (error) {
    console.error("Error al subir archivo a Firebase Storage:", error);
    throw new Error("Error al subir el archivo. Inténtalo de nuevo.");
  }
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
 * @param orderId - El ID de la orden (para organizar los archivos)
 * @returns URL de descarga del comprobante
 */
export const uploadComprobante = async (
  file: File,
  orderId: string
): Promise<UploadFileResult> => {
  const folder = `orders/${orderId}/comprobantes`;
  return uploadFile(file, folder);
};

/**
 * Sube la imagen del arreglo de una orden
 * @param file - El archivo de la imagen del arreglo
 * @param orderId - El ID de la orden (para organizar los archivos)
 * @returns URL de descarga de la imagen del arreglo
 */
export const uploadArreglo = async (
  file: File,
  orderId: string
): Promise<UploadFileResult> => {
  const folder = `orders/${orderId}/arreglos`;
  return uploadFile(file, folder);
};
