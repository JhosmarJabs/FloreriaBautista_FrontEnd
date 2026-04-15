import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DownloadCloud, X, FileText, FileSpreadsheet } from 'lucide-react';
import { AnimatedButton } from './Animations';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  title: string;
  filename?: string;
}

export default function ExportModal({ isOpen, onClose, data, title, filename = 'exportacion' }: ExportModalProps) {
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');

  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    if (format === 'csv') {
      exportToCSV(data, filename);
    } else if (format === 'pdf') {
      exportToPDF(data, title, filename);
    }
    
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
          onClick={onClose}
        />
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white p-8 rounded-[2rem] shadow-2xl max-w-md w-full flex flex-col"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <h3 className="text-2xl font-black text-slate-900 mb-2">Exportar Datos</h3>
          <p className="text-slate-500 mb-6">Seleccione el formato en el que desea exportar los registros.</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setFormat('csv')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                format === 'csv' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <FileSpreadsheet className={`w-8 h-8 ${format === 'csv' ? 'text-blue-500' : 'text-slate-400'}`} />
              <span className="font-bold">Formato CSV</span>
            </button>

            <button
              onClick={() => setFormat('pdf')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                format === 'pdf' 
                  ? 'border-rose-500 bg-rose-50 text-rose-700' 
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <FileText className={`w-8 h-8 ${format === 'pdf' ? 'text-rose-500' : 'text-slate-400'}`} />
              <span className="font-bold">Formato PDF</span>
            </button>
          </div>

          <div className="flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <AnimatedButton 
              onClick={handleExport}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <DownloadCloud className="w-5 h-5" />
              Exportar
            </AnimatedButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
