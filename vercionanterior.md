```tsx
  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AdminService.getAdminInventory({
        busqueda:   invBusqueda  || undefined,
        sucursal:   invSucursal  || undefined,
        bajoMinimo: invBajoMin,
        page:       invPage,
        size:       20,
      });
      setInventory(res.data.items);
      setInvTotal(res.data.total);
      setInvTotalPags(res.data.totalPaginas ?? 1);
    } catch {
      showToast('Error al cargar inventario', 'error');
    } finally {
      setLoading(false);
    }
  }, [invBusqueda, invSucursal, invBajoMin, invPage]);
```
