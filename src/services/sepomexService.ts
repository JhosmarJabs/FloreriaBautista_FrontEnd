// Servicio de códigos postales (SEPOMEX) — datos locales servidos como
// fragmentos estáticos en /public/sepomex/{prefijo}.json (prefijo = 2 primeros dígitos).
// Cada CP se guarda como [estado, municipio, colonias[]] para minimizar peso.
// Solo se descarga el fragmento del CP consultado (~40 KB) y se cachea en memoria.

export interface CpInfo {
  estado: string;
  municipio: string;
  colonias: string[];
}

type Shard = Record<string, [string, string, string[]]>;

// Cache de fragmentos ya descargados (clave = prefijo de 2 dígitos)
const shardCache = new Map<string, Promise<Shard | null>>();

const loadShard = (prefix: string): Promise<Shard | null> => {
  const cached = shardCache.get(prefix);
  if (cached) return cached;

  const promise = fetch(`/sepomex/${prefix}.json`)
    .then(res => (res.ok ? (res.json() as Promise<Shard>) : null))
    .catch(() => null);

  shardCache.set(prefix, promise);
  return promise;
};

/**
 * Busca la información de un código postal mexicano (5 dígitos).
 * Devuelve estado, municipio y la lista de colonias, o null si no existe.
 */
export const lookupCp = async (cp: string): Promise<CpInfo | null> => {
  const clean = (cp || '').trim();
  if (!/^\d{5}$/.test(clean)) return null;

  const shard = await loadShard(clean.slice(0, 2));
  const entry = shard?.[clean];
  if (!entry) return null;

  const [estado, municipio, colonias] = entry;
  return { estado, municipio, colonias: colonias ?? [] };
};
