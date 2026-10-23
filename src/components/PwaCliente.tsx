import React, { useEffect } from 'react';
import PwaUpdatePrompt from './PwaUpdatePrompt';
import InstallPrompt from './InstallPrompt';
import { cargarDatosOffline } from '../services/calentamientoOffline';

/**
 * Piezas del PWA para la parte pública y del cliente: aviso de versión nueva,
 * tarjeta de instalación y carga de los datos públicos para verlos sin red.
 * App.tsx no lo monta en /admin ni /empleado: el web privado no forma parte del
 * PWA. El aviso «Sin conexión» es AvisoConexion (toda la web).
 */
export default function PwaCliente() {
  useEffect(() => {
    cargarDatosOffline();
  }, []);

  return (
    <>
      <PwaUpdatePrompt />
      <InstallPrompt />
    </>
  );
}
