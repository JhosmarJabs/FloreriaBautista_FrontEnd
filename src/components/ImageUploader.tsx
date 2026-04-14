import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageIcon, Upload, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Props
   
   El componente NO sube nada por sí mismo.
   Solo gestiona la selección de archivo y la previsualización.
   El formulario padre es responsable de llamar a uploadToCloudinary
   en el momento de "Guardar" y reportar el progreso mediante props.

   Flujo esperado en el padre:
     1. Usuario selecciona archivo → onFileSelect(file) se llama
     2. Usuario pulsa "Guardar":
        a. Padre llama uploadToCloudinary(selectedFile)  → isUploading = true
        b. Cloudinary responde con URL                   → isUploading = false, uploadedUrl = url
        c. Padre guarda el recurso en la BD con la URL
   ───────────────────────────────────────────────────────────── */
interface ImageUploaderProps {
  /** Archivo seleccionado — el padre llama uploadToCloudinary(file) al guardar */
  onFileSelect: (file: File | null) => void;
  /** URL existente (modo edición) — se muestra como imagen guardada */
  existingUrl?: string;
  /** El padre pone esto en `true` mientras hace el upload a Cloudinary */
  isUploading?: boolean;
  /** El padre pone esta URL cuando Cloudinary ya respondió correctamente */
  uploadedUrl?: string;
  /** Etiqueta */
  label?: string;
  /** Hint informativo */
  hint?: string;
}

type LocalState = 'idle' | 'selected' | 'existing';

export default function ImageUploader({
  onFileSelect,
  existingUrl,
  isUploading = false,
  uploadedUrl,
  label = 'Imagen',
  hint,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [localState, setLocalState] = useState<LocalState>(existingUrl ? 'existing' : 'idle');
  const [preview, setPreview]       = useState<string | null>(existingUrl ?? null);
  const [fileName, setFileName]     = useState<string>('');
  const [error, setError]           = useState<string>('');
  const [dragging, setDragging]     = useState(false);

  // Sincronizar si el padre nos pasa una URL existente después del montaje (ej. carga asíncrona)
  React.useEffect(() => {
    if (existingUrl && localState === 'idle') {
      setPreview(existingUrl);
      setLocalState('existing');
    }
  }, [existingUrl, localState]);

  /* ── Valida el archivo y muestra preview local ── */
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes (JPG, PNG, WEBP...)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen no puede superar 10 MB');
      return;
    }
    setError('');
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setFileName(file.name);
    setLocalState('selected');
    onFileSelect(file);
  }, [onFileSelect]);

  /* ── Drag & Drop ── */
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  /* ── Input change ── */
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  /* ── Quitar imagen ── */
  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName('');
    setError('');
    setLocalState('idle');
    onFileSelect(null);
  };

  /* ── Estado visual final ── */
  // Si ya subió correctamente (padre nos lo dice)
  const isDone    = Boolean(uploadedUrl);
  const showImage = isDone ? uploadedUrl! : preview;

  /* ─────────────────────────────────────────────── */
  return (
    <div className="space-y-1.5">
      {/* Etiqueta */}
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {label}
        </label>
        {hint && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {hint}
          </span>
        )}
      </div>

      {/* Zona de drop / preview */}
      <div
        onClick={() => !isUploading && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative w-full rounded-2xl border-2 transition-all select-none overflow-hidden
          ${isUploading
            ? 'cursor-wait border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-900/20'
            : localState === 'idle' && !error
              ? 'cursor-pointer border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'
              : isDone
                ? 'cursor-pointer border-emerald-300 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-900/10'
                : localState === 'selected'
                  ? 'cursor-pointer border-blue-300 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-900/10'
                  : error
                    ? 'cursor-pointer border-rose-300 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-900/10'
                    : 'cursor-pointer border-slate-200 dark:border-slate-700'
          }
          ${dragging ? 'border-blue-400 dark:border-blue-600 scale-[1.01]' : ''}
        `}
      >
        <AnimatePresence mode="wait">

          {/* IDLE */}
          {localState === 'idle' && !error && (
            <motion.div key="idle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-3 py-10 px-6">
              <div className="size-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500">
                <ImageIcon className="w-7 h-7" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">Seleccionar imagen</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Arrastra aquí o haz clic · JPG, PNG, WEBP (máx. 10 MB)
                </p>
                <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">
                  La imagen se subirá a Cloudinary al guardar el formulario
                </p>
              </div>
            </motion.div>
          )}

          {/* ERROR */}
          {error && (
            <motion.div key="error"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-3 py-10 px-6">
              <div className="size-14 bg-rose-100 dark:bg-rose-900/40 rounded-2xl flex items-center justify-center text-rose-500 dark:text-rose-400">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{error}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Haz clic para seleccionar otra imagen</p>
              </div>
            </motion.div>
          )}

          {/* PREVIEW (archivo seleccionado, pendiente de subir) */}
          {(localState === 'selected' || localState === 'existing') && showImage && !isUploading && !isDone && (
            <motion.div key="preview"
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="relative group">
              <img src={showImage} alt="preview" className="w-full h-52 object-cover" />
              {/* Overlay hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow hover:bg-slate-50 dark:hover:bg-slate-700">
                    <Upload className="w-3.5 h-3.5" />Cambiar
                  </button>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); clear(); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 shadow hover:bg-slate-50 dark:hover:bg-slate-700">
                    <X className="w-3.5 h-3.5" />Quitar
                  </button>
                </div>
              </div>
              {/* Badge pendiente */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-blue-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                <Upload className="w-3 h-3" />
                {localState === 'existing' ? 'Imagen guardada' : 'Lista para subir al guardar'}
              </div>
            </motion.div>
          )}

          {/* UPLOADING (padre subiendo a Cloudinary) */}
          {isUploading && (
            <motion.div key="uploading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="relative">
              {showImage && (
                <img src={showImage} alt="subiendo" className="w-full h-52 object-cover opacity-40 dark:opacity-20" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Subiendo a Cloudinary...</p>
                  {fileName && <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[220px] mt-0.5">{fileName}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* DONE (Cloudinary respondió con URL) */}
          {isDone && uploadedUrl && (
            <motion.div key="done"
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="relative group">
              <img src={uploadedUrl} alt="subida" className="w-full h-52 object-cover" />
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                <CheckCircle2 className="w-3 h-3" />Subida correctamente a Cloudinary
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Nombre del archivo */}
      {fileName && !isDone && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate px-1">📎 {fileName}</p>
      )}

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onInputChange}
        disabled={isUploading}
      />
    </div>
  );
}
