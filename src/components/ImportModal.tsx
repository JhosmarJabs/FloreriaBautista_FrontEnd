import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UploadCloud,
  X,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { AnimatedButton } from "./Animations";
import * as XLSX from "xlsx";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any[], file: File) => Promise<void>;
  title: string;
}

export default function ImportModal({
  isOpen,
  onClose,
  onConfirm,
  title,
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let workbook: XLSX.WorkBook;
        if (selectedFile.name.endsWith(".csv")) {
          // Leer CSV como texto UTF-8 para preservar tildes y caracteres especiales
          const text = event.target?.result as string;
          workbook = XLSX.read(text, { type: "string" });
        } else if (selectedFile.name.endsWith(".xlsx")) {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          workbook = XLSX.read(data, { type: "array" });
        } else {
          setError(
            "Formato no soportado. Por favor suba un archivo CSV o XLSX.",
          );
          return;
        }
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length > 0) {
          setPreviewData(json);
        } else {
          setError("El archivo está vacío o no tiene el formato correcto.");
        }
      } catch (err) {
        setError(
          "Error al procesar el archivo. Asegúrese de que el formato sea válido.",
        );
      }
    };

    if (selectedFile.name.endsWith(".csv")) {
      reader.readAsText(selectedFile, "UTF-8");
    } else {
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleConfirm = async () => {
    if (previewData.length > 0 && file) {
      setIsLoading(true);
      setError(null);
      try {
        await onConfirm(previewData, file);
        handleClose();
      } catch (err: any) {
        setError(err.message || "Error al procesar la importación en el servidor.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={handleClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white p-8 rounded-[2rem] shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col"
        >
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <h3 className="text-2xl font-black text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-500 mb-8">
            Cargue un archivo CSV o XLSX para importar los registros.
          </p>

          {!file ? (
            <div
              className="border-2 border-dashed border-slate-300 rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-50/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="w-16 h-16 text-blue-500 mb-4" />
              <p className="text-lg font-bold text-slate-700 mb-2">
                Haga clic para seleccionar un archivo
              </p>
              <p className="text-sm text-slate-500">
                Soporta archivos .csv y .xlsx
              </p>
              <input
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                  <div>
                    <p className="font-bold text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(2)} KB • {previewData.length}{" "}
                      registros detectados
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreviewData([]);
                    setError(null);
                  }}
                  className="text-sm font-bold text-blue-600 hover:underline disabled:opacity-50"
                  disabled={isLoading}
                >
                  Cambiar archivo
                </button>
              </div>

              {error ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 mb-6">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              ) : (
                <div className="flex-1 overflow-auto border border-slate-200 rounded-xl mb-6">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 sticky top-0 shadow-sm">
                      <tr>
                        {previewData.length > 0 &&
                          Object.keys(previewData[0]).map((key) => (
                            <th
                              key={key}
                              className="px-4 py-3 font-bold text-slate-600 border-b border-slate-200"
                            >
                              {key}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewData.slice(0, 50).map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          {Object.values(row).map((val: any, j) => (
                            <td
                              key={j}
                              className="px-4 py-3 text-slate-600 truncate max-w-[200px]"
                            >
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 50 && (
                    <div className="p-3 text-center text-xs font-bold text-slate-400 bg-slate-50 border-t border-slate-100">
                      Mostrando 50 de {previewData.length} registros
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-auto pt-4 border-t border-slate-100">
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <AnimatedButton
                  onClick={handleConfirm}
                  disabled={!!error || previewData.length === 0 || isLoading}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Confirmar Importación
                    </>
                  )}
                </AnimatedButton>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
