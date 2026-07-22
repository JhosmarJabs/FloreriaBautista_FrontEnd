// Catalogo
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  Lock,
  Plus,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Package,
  CheckCircle2,
  AlertTriangle,
  Search,
  ShoppingCart,
  UploadCloud,
  DownloadCloud,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AdminService } from "../../services/adminService";
import { Product } from "../../types";
import { useCart } from "../../hooks/useCart";
import CustomDropdown from "../../components/CustomDropdown";
import { useToast } from "../../hooks/useToast";
import {
  FadeIn,
  StaggerContainer,
  AnimatedButton,
} from "../../components/Animations";
import ImportModal from "../../components/ImportModal";
import { esCliente } from "../../utils/auth";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function CatalogPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [priceRange, setPriceRange] = useState(5000);
  const [selectedType, setSelectedType] = useState("Todos los tipos");
  const [showInStockOnly, setShowInStockOnly] = useState("Todas");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  useEffect(() => {
    let currentUserRole = null;
    const storedUser = localStorage.getItem("usuario") || localStorage.getItem("user");
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      currentUserRole = parsedUser.role;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        let res;
        // Si es admin o empleado, consume la ruta del inventario administrativo.
        // Si es visitante web o cliente verificado, consume la ruta pública oficial.
        if (currentUserRole === "administrador" || currentUserRole === "admin" || currentUserRole === "empleado") {
          res = await AdminService.getAdminProducts({ size: 100 });
        } else {
          res = await AdminService.getProducts({ size: 100 });
        }
        setProducts(res.data.items);
      } catch {
        showToast("Error al cargar el catálogo", "error");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleImportConfirm = async (_data: any[], file: File) => {
    setLoading(true);
    try {
      await AdminService.importAdminProducts(file);
      const res = await AdminService.getAdminProducts({ size: 100 });
      setProducts(res.data.items);
      showToast(`Importación exitosa`, "success");
    } catch {
      showToast("Error al importar productos.", "error");
    } finally {
      setLoading(false);
      setIsImportModalOpen(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await AdminService.exportAdminProducts();
      // Inyectar BOM para que Excel detecte UTF-8 y no corrompa tildes/ñ
      const text = await blob.text();
      const BOM = '\uFEFF';
      const blobWithBom = new Blob([BOM + text], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blobWithBom);
      const a = document.createElement("a");
      a.href = url;
      a.download = "catalogo_export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Error al exportar productos", "error");
    }
  };

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesSearch =
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "Todos" || product.tipo === selectedCategory;
      const matchesPrice = product.precioBase <= priceRange;
      const matchesType =
        selectedType === "Todos los tipos" || product.tipo === selectedType;
      const matchesStock = showInStockOnly === "Todas" || (product.stock ?? 0) > 0;
      return matchesSearch && matchesCategory && matchesPrice && matchesType && matchesStock;
    });

    // Orden: primero los que SÍ tienen imagen, luego alfabéticamente por nombre.
    const tieneImagen = (p: Product) => (p.imagenUrl && p.imagenUrl.trim() ? 1 : 0);
    return filtered.sort((a, b) => {
      const imgDiff = tieneImagen(b) - tieneImagen(a);
      if (imgDiff !== 0) return imgDiff;
      return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
    });
  }, [products, searchTerm, selectedCategory, priceRange, selectedType, showInStockOnly]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const categories = [
    "Todos",
    ...Array.from(new Set(products.map((p) => p.tipo))),
  ];
  const productTypes = [
    "Todos los tipos",
    ...Array.from(new Set(products.map((p) => p.tipo))),
  ] as string[];

  const handleAddToCart = (product: Product) => {
    if (esCliente(user)) {
      addToCart(product);
      showToast(`¡${product.nombre} añadido al carrito!`, "success");
    } else {
      setIsLoginModalOpen(true);
    }
  };

  // Admin view
  if (user?.role === "administrador" || user?.role === "admin") {
    return (
      <div className="min-h-full" style={{ zoom: 0.75 }}>
        <div className="w-full space-y-6">
          <div>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-[#f8f6f6] p-8 rounded-3xl border border-slate-200 flex justify-between items-center group hover:border-blue-500/30 transition-all"
              >
                <div>
                  <p className="text-slate-500 text-sm font-medium mb-2">Total productos</p>
                  <h3 className="text-5xl font-black text-slate-900 mb-2 tracking-tight">{products.length}</h3>
                  <p className="text-emerald-600 text-sm font-bold flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> desde la API
                  </p>
                </div>
                <div className="bg-blue-500/10 p-5 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                  <Package className="w-10 h-10" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="bg-[#f8f6f6] p-8 rounded-3xl border border-slate-200 flex justify-between items-center group hover:border-emerald-500/30 transition-all"
              >
                <div>
                  <p className="text-slate-500 text-sm font-medium mb-2">Activos</p>
                  <h3 className="text-5xl font-black text-slate-900 mb-2 tracking-tight">
                    {products.filter((p) => p.estado === "ACTIVO").length}
                  </h3>
                  <p className="text-emerald-600 text-sm font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />{" "}
                    {products.length
                      ? Math.round(
                          (products.filter((p) => p.estado === "ACTIVO").length / products.length) * 100,
                        )
                      : 0}
                    % del total
                  </p>
                </div>
                <div className="bg-emerald-500/10 p-5 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-10 h-10" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="bg-[#f8f6f6] p-8 rounded-3xl border border-slate-200 flex justify-between items-center group hover:border-orange-500/30 transition-all"
              >
                <div>
                  <p className="text-slate-500 text-sm font-medium mb-2">Bajo Stock</p>
                  <h3 className="text-5xl font-black text-slate-900 mb-2 tracking-tight">
                    {products.filter((p) => (p.stock ?? 0) <= 5).length}
                  </h3>
                  <p className="text-orange-600 text-sm font-bold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Requiere atención
                  </p>
                </div>
                <div className="bg-orange-500/10 p-5 rounded-2xl text-orange-600 group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-10 h-10" />
                </div>
              </motion.div>
            </div>

            {/* Filters & Catalog Actions */}
            <div className="bg-slate-50 backdrop-blur-md p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-[#1e3a5f] text-white shadow-lg shadow-blue-900/20"
                        : "hover:bg-slate-100 text-slate-500 font-medium"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-black px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
                >
                  <UploadCloud className="w-5 h-5" />
                  Importar
                </button>
                <button
                  onClick={handleExport}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-black px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
                >
                  <DownloadCloud className="w-5 h-5" />
                  Exportar
                </button>
                <button
                  onClick={() => navigate("/admin/productos/nuevo")}
                  className="bg-[#fbbf24] hover:bg-[#f59e0b] text-[#1e3a5f] font-black px-8 py-3 rounded-xl shadow-xl shadow-yellow-500/10 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
                >
                  <Plus className="w-6 h-6 stroke-[3px]" />
                  Nuevo producto
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Producto</th>
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Tipo</th>
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Precio</th>
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Stock</th>
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Estado</th>
                      <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence mode="popLayout">
                      {paginatedProducts.map((product) => (
                        <motion.tr
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          key={product.id}
                          className="hover:bg-slate-50 transition-colors group"
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-5">
                              <div className="size-16 rounded-full bg-slate-100 overflow-hidden border-2 border-slate-200 group-hover:border-blue-500/50 transition-colors">
                                {product.imagenUrl ? (
                                  <img
                                    src={product.imagenUrl}
                                    alt={product.nombre}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <Package className="w-6 h-6" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-black text-slate-900 text-lg leading-tight mb-1">{product.nombre}</p>
                                <p className="text-xs font-bold text-slate-400 tracking-wider">ID: {product.id.slice(0,8).toUpperCase()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-blue-600 text-[10px] font-black tracking-widest uppercase">{product.tipo}</span>
                          </td>
                          <td className="px-8 py-5 font-black text-slate-900 text-lg">
                            ${product.precioBase.toLocaleString()}
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className={`font-bold ${(product.stock ?? 0) <= 5 ? "text-orange-600" : "text-slate-500"}`}>
                                {product.stock ?? "—"} unidades
                              </span>
                              {(product.stock ?? 0) <= 5 && (
                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-tighter">Stock Crítico</span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <span className={`size-2.5 rounded-full ${product.estado === "ACTIVO" ? "bg-emerald-500" : "bg-slate-300"} shadow-sm`} />
                              <span className={`text-sm font-bold ${product.estado === "ACTIVO" ? "text-emerald-600" : "text-slate-400"}`}>
                                {product.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-6">
                              <button
                                onClick={() => navigate(`/admin/productos/editar/${product.id}`)}
                                className="text-sm font-black text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                Editar
                              </button>
                              <button className="text-sm font-black text-slate-400 hover:text-red-600 transition-colors">
                                {product.estado === "ACTIVO" ? "Desactivar" : "Activar"}
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-8 py-6 bg-slate-50 flex flex-col md:flex-row items-center justify-between border-t border-slate-100 gap-4">
                <p className="text-sm font-bold text-slate-500">
                  Mostrando{" "}
                  <span className="text-slate-900">
                    {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredProducts.length)}
                  </span>{" "}
                  de <span className="text-slate-900">{filteredProducts.length}</span> productos
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}
                    className="p-2.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`size-11 flex items-center justify-center rounded-xl font-black text-sm transition-all ${
                        currentPage === page ? "bg-[#1e3a5f] text-white shadow-xl shadow-blue-900/20" : "hover:bg-slate-100 text-slate-500 font-bold"
                      }`}>
                      {page}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                    className="p-2.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <ImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onConfirm={handleImportConfirm}
            title="Importar Productos"
          />
        </div>
      </div>
    );
  }

  // Customer View
  return (
    <main className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-12 pt-32 min-h-screen font-sans overflow-hidden">
      <FadeIn className="mb-12">
        <div className="relative w-full bg-gradient-to-br from-[#1A3B5B] via-[#2A527A] to-[#1A3B5B] rounded-[3rem] p-[30px] mb-12 overflow-hidden shadow-2xl shadow-blue-900/20">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FBBF24] rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400 rounded-full blur-[120px] opacity-20 translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 px-4 md:px-8">
            <div className="max-w-2xl">
              <span className="inline-block py-1.5 px-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/90 text-sm font-black tracking-widest uppercase mb-6">
                Descubre la magia
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                Nuestro <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FBBF24] to-yellow-200 drop-shadow-sm">Catálogo</span> Floral
              </h2>
              <p className="text-lg text-blue-100 font-medium leading-relaxed max-w-xl">
                Sorprende y cautiva con nuestros diseños exclusivos. Flores frescas y de la más alta calidad, preparadas con pasión.
              </p>
            </div>
            <div className="flex flex-col items-end gap-6 w-full md:w-auto">
              <div className="relative w-full md:w-96 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-[#FBBF24] transition-colors z-10" />
                <input
                  type="text"
                  placeholder="Buscar tu arreglo ideal..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-14 pr-6 py-4 bg-white border-0 rounded-full text-base font-medium text-[#1A3B5B] focus:ring-4 focus:ring-[#FBBF24]/30 focus:outline-none transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-black text-[#1A3B5B] uppercase tracking-widest bg-[#FBBF24] px-5 py-2.5 rounded-full shadow-lg shadow-yellow-500/20 transform hover:scale-105 transition-transform">
                <Filter className="w-4 h-4" />
                <span>{filteredProducts.length} productos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Filters Bar (Yandex/Ebay style) */}
        <div className="max-w-7xl mx-auto px-4 md:px-0 mb-8 border-b border-slate-100 pb-2">
          {/* Quick Category Links */}
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
             {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                  className={`flex-none px-6 py-2.5 rounded-full font-black text-sm transition-all snap-start whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-slate-100 text-[#1A3B5B] shadow-inner"
                      : "bg-transparent text-slate-500 hover:text-[#1A3B5B] hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
          </div>
          
          {/* Pill Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 py-4 border-t border-slate-50">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mr-2 uppercase tracking-widest hidden md:flex">
              <Filter className="w-4 h-4 text-[#FBBF24]" />
              Filtros
            </div>
            
            <div className="w-full sm:w-56">
              <CustomDropdown
                options={productTypes.map(pt => ({ label: pt === "Todos los tipos" ? "Ocasión: Todos" : pt, value: pt }))}
                value={selectedType}
                onChange={(val) => { setSelectedType(val); setCurrentPage(1); }}
              />
            </div>
            <div className="w-full sm:w-56">
              <CustomDropdown
                options={[
                  { label: "Precio: Cualquiera", value: "5000" },
                  { label: "Hasta $500", value: "500" },
                  { label: "Hasta $1,000", value: "1000" },
                  { label: "Hasta $2,000", value: "2000" },
                  { label: "Hasta $3,000", value: "3000" }
                ]}
                value={String(priceRange)}
                onChange={(val) => { setPriceRange(Number(val)); setCurrentPage(1); }}
              />
            </div>
            <div className="w-full sm:w-56">
              <CustomDropdown
                options={[
                  { label: "Disponibilidad: Todas", value: "Todas" },
                  { label: "Solo en stock", value: "En stock" }
                ]}
                value={showInStockOnly}
                onChange={(val) => { setShowInStockOnly(val); setCurrentPage(1); }}
              />
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-6 gap-y-8">
        <AnimatePresence mode="popLayout">
          {paginatedProducts.length > 0 ? (
            paginatedProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                layout
                whileHover={{ y: -4 }}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-shadow duration-300 flex flex-col relative"
              >
                <Link to={`/producto/${product.id}`} className="flex flex-col flex-1">
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100">
                    {product.imagenUrl ? (
                      <img
                        src={product.imagenUrl}
                        alt={product.nombre}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="w-12 h-12 text-slate-200" />
                      </div>
                    )}

                    {(product.stock ?? 0) <= 5 && (product.stock ?? 0) > 0 && (
                      <div className="absolute top-3 left-3 bg-red-500 px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wide flex items-center gap-1 shadow-md">
                        <AlertCircle className="w-3 h-3" /> Pocos
                      </div>
                    )}
                  </div>

                  <div className="px-4 pt-3 flex flex-col flex-1">
                    <span className="self-start bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide mb-2">
                      {product.tipo}
                    </span>

                    <h3 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
                      {product.nombre}
                    </h3>
                  </div>
                </Link>

                <div className="px-4 pb-4 pt-2 flex items-center justify-between gap-2">
                  <span className="text-xl font-black text-[#1A3B5B]">
                    ${product.precioBase.toLocaleString()}
                  </span>
                  <AnimatedButton
                    className="w-10 h-10 shrink-0 rounded-full bg-[#1A3B5B] hover:bg-[#FBBF24] text-white hover:text-[#1A3B5B] flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300"
                    onClick={() => handleAddToCart(product)}
                    aria-label={`Agregar ${product.nombre} al carrito`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </AnimatedButton>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-32 text-center"
            >
              <div className="bg-white rounded-[3rem] p-16 border border-slate-100 shadow-2xl inline-block max-w-lg">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Search className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-[#1A3B5B] mb-4">No encontramos lo que buscas</h3>
                <p className="text-slate-500 font-medium mb-10">
                  Ajusta los filtros o intenta con una búsqueda diferente.
                </p>
                <button
                  onClick={() => { setSearchTerm(""); setSelectedCategory("Todos"); setPriceRange(5000); setSelectedType("Todos los tipos"); }}
                  className="px-10 py-4 bg-[#FBBF24] text-[#1A3B5B] font-black rounded-2xl shadow-xl shadow-yellow-500/20 hover:scale-105 transition-transform uppercase text-sm tracking-widest"
                >
                  Limpiar filtros
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <FadeIn className="mt-20 flex justify-center">
          <nav className="flex items-center gap-3 bg-white p-2 rounded-3xl shadow-xl border border-slate-100">
            <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}
              className="p-3 text-slate-400 hover:text-[#1A3B5B] hover:bg-slate-50 rounded-2xl transition-all disabled:opacity-30">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-12 h-12 rounded-2xl font-black text-sm transition-all ${
                    currentPage === page ? "bg-[#1A3B5B] text-white shadow-xl shadow-blue-900/20" : "text-slate-500 hover:bg-slate-50"
                  }`}>
                  {page}
                </button>
              ))}
            </div>
            <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
              className="p-3 text-slate-400 hover:text-[#1A3B5B] hover:bg-slate-50 rounded-2xl transition-all disabled:opacity-30">
              <ChevronRight className="w-6 h-6" />
            </button>
          </nav>
        </FadeIn>
      )}

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#1A3B5B]/60 backdrop-blur-md"
              onClick={() => setIsLoginModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white p-12 rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] max-w-md w-full text-center border border-white/20"
            >
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <Lock className="w-10 h-10 text-[#1A3B5B]" />
              </div>
              <h3 className="text-3xl font-black text-[#1A3B5B] mb-4 leading-tight">¡Únete a nuestra comunidad!</h3>
              <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                Para añadir productos a tu pedido necesitas tener una cuenta activa. ¡Es rápido y gratis!
              </p>
              <div className="flex flex-col gap-4">
                <Link to="/login" className="w-full bg-[#1A3B5B] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:scale-[1.02] transition-transform">
                  Iniciar sesión
                </Link>
                <Link to="/registro" className="w-full border-2 border-[#1A3B5B] text-[#1A3B5B] py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                  Registrarme
                </Link>
              </div>
              <button className="mt-8 text-slate-400 hover:text-[#1A3B5B] text-sm font-black uppercase tracking-widest transition-colors"
                onClick={() => setIsLoginModalOpen(false)}>
                Tal vez luego
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
