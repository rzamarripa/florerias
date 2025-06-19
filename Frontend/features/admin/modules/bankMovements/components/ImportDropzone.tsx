'use client';
import React from "react";
import { useDropzone } from "react-dropzone";

interface ImportDropzoneProps {
  file: File | null;
  setFile: (file: File | null) => void;
}

const ImportDropzone: React.FC<ImportDropzoneProps> = ({ file, setFile }) => {
  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      console.log('Archivo seleccionado:', acceptedFiles[0]);
    }
  }, [setFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
  });

  return (
    <div {...getRootProps()} className="border border-2 rounded p-4 text-center bg-light" style={{ cursor: "pointer" }}>
      <input {...getInputProps()} />
      {file ? (
        <div>
          <p className="mb-2">Archivo seleccionado: <strong>{file.name}</strong></p>
          <button type="button" className="btn btn-sm btn-danger" onClick={e => { e.stopPropagation(); setFile(null); }}>Quitar archivo</button>
        </div>
      ) : (
        <>
          <p className="mb-2">
            {isDragActive ? "Suelta el archivo aquí..." : "Arrastra y suelta un archivo Excel aquí, o haz clic para seleccionar uno."}
          </p>
          <small className="text-muted">Solo se aceptan archivos .xlsx o .xls</small>
        </>
      )}
    </div>
  );
};

export default ImportDropzone; 