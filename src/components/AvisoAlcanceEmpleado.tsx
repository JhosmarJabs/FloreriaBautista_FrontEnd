import { Info } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/**
 * Explica al empleado por qué esta vista muestra menos de lo que mostraba antes.
 *
 * Desde que el alcance del rol EMPLEADO se aplica en el backend
 * (AdminOrdersController → OrderService.QueryVisiblePorEmpleado), estas pantallas
 * devuelven solo los pedidos PROPIOS del día: los que el empleado registró hoy y
 * los que registró antes y se entregan hoy. Los de compañeros, los de la tienda
 * en línea y el historial los atiende el administrador (decisión D-1,
 * empleado-pedidos-alcance-propio). Sin este aviso, un filtro vacío parece un
 * fallo del sistema en vez de la regla de negocio que es.
 *
 * Para el administrador no se muestra nada: él sigue viendo todo.
 */
export default function AvisoAlcanceEmpleado({ recurso = 'pedidos' }: { recurso?: string }) {
  const { esAdmin } = useAuth();

  if (esAdmin) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-200">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>
        Ves únicamente tus {recurso} de <strong>hoy</strong>: los que registraste hoy y los que
        registraste antes y se entregan hoy. Los de tus compañeros, los de la tienda en línea y el
        historial los atiende el administrador.
      </p>
    </div>
  );
}
