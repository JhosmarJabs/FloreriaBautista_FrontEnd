import { Info } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/**
 * Explica al empleado por qué esta vista muestra menos de lo que mostraba antes.
 *
 * Desde que el alcance del rol EMPLEADO se aplica en el backend
 * (AdminOrdersController → OrderService.ListarEmpleadoAsync), estas pantallas
 * devuelven solo los pedidos del día: los que capturó el propio empleado y los
 * que se entregan hoy. Sin este aviso, un filtro vacío parece un fallo del
 * sistema en vez de la regla de negocio que es.
 *
 * Para el administrador no se muestra nada: él sigue viendo todo.
 */
export default function AvisoAlcanceEmpleado({ recurso = 'pedidos' }: { recurso?: string }) {
  const { esAdmin } = useAuth();

  if (esAdmin) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>
        Ves únicamente los {recurso} de <strong>hoy</strong>: los que registraste tú y los que se
        entregan hoy. El historial y las operaciones de otros compañeros los consulta el
        administrador.
      </p>
    </div>
  );
}
