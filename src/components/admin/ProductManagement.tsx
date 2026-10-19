import React, { useState, useMemo } from 'react';
import { Product, Category, CurrencyCode, ProductStatus } from '../../types';
import { db } from '../../utils/storage';
import { formatCurrency, generateSKU } from '../../utils/formatters';
import { Pagination } from '../common/Pagination';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { 
  Plus, Search, Filter, Edit, Trash2, Copy, Eye, CheckCircle, XCircle, 
  Sparkles, ArrowUpDown, Package, Layers, X, RefreshCw
} from 'lucide-react';

interface Props {
  products: Product[];
  categories: Category[];
  currency: CurrencyCode;
  addToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const ProductManagement: React.FC<Props> = ({
  products,
  categories,
  currency,
  addToast,
}) => {
  // State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'priceUSD' | 'stockQuantity' | 'name' | 'rating'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    sku: '',
    categoryId: '',
    priceUSD: '',
    salePriceUSD: '',
    stockQuantity: '',
    status: 'active' as ProductStatus,
    description: '',
    ingredients: '',
    howToUse: '',
    imageUrl: '',
    shadesInput: '',
    tagsInput: '',
    isBestSeller: false,
    isNewArrival: false,
    isOrganic: true,
  });

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q));

      const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchStatus = selectedStatus === 'all' || p.status === selectedStatus;

      let matchStock = true;
      if (selectedStockStatus === 'in_stock') matchStock = p.stockQuantity > 15;
      if (selectedStockStatus === 'low_stock') matchStock = p.stockQuantity > 0 && p.stockQuantity <= 15;
      if (selectedStockStatus === 'out_of_stock') matchStock = p.stockQuantity === 0;

      return matchSearch && matchCategory && matchStatus && matchStock;
    }).sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, search, selectedCategory, selectedStatus, selectedStockStatus, sortBy, sortOrder]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;

  // Handlers
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      subtitle: '',
      sku: generateSKU('HZ'),
      categoryId: categories[0]?.id || '',
      priceUSD: '',
      salePriceUSD: '',
      stockQuantity: '50',
      status: 'active',
      description: '',
      ingredients: 'Organic Saffron Extract, Rosehip Seed Oil, Pure Botanical Essences',
      howToUse: 'Apply gently onto clean skin morning and night.',
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
      shadesInput: 'Natural Velvet, Royal Gold',
      tagsInput: 'Luxury, Organic, Saffron',
      isBestSeller: false,
      isNewArrival: true,
      isOrganic: true,
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      subtitle: product.subtitle || '',
      sku: product.sku,
      categoryId: product.categoryId,
      priceUSD: product.priceUSD.toString(),
      salePriceUSD: product.salePriceUSD ? product.salePriceUSD.toString() : '',
      stockQuantity: product.stockQuantity.toString(),
      status: product.status,
      description: product.description,
      ingredients: product.ingredients || '',
      howToUse: product.howToUse || '',
      imageUrl: product.imageUrl,
      shadesInput: product.shades ? product.shades.join(', ') : '',
      tagsInput: product.tags ? product.tags.join(', ') : '',
      isBestSeller: product.isBestSeller,
      isNewArrival: product.isNewArrival,
      isOrganic: product.isOrganic,
    });
    setIsAddEditOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.priceUSD || !formData.categoryId) {
      addToast('error', 'Validation Failed', 'Product Name, Price, and Category are required.');
      return;
    }

    const categoryObj = categories.find(c => c.id === formData.categoryId);
    const categoryName = categoryObj ? categoryObj.name : 'Cosmetics';

    const shadesArr = formData.shadesInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const tagsArr = formData.tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (editingProduct) {
      // Update
      const updated = db.updateProduct(editingProduct.id, {
        name: formData.name.trim(),
        subtitle: formData.subtitle.trim(),
        sku: formData.sku.trim(),
        categoryId: formData.categoryId,
        categoryName,
        priceUSD: parseFloat(formData.priceUSD) || 0,
        salePriceUSD: formData.salePriceUSD ? parseFloat(formData.salePriceUSD) : undefined,
        stockQuantity: parseInt(formData.stockQuantity, 10) || 0,
        status: formData.status,
        description: formData.description.trim(),
        ingredients: formData.ingredients.trim(),
        howToUse: formData.howToUse.trim(),
        imageUrl: formData.imageUrl.trim() || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
        shades: shadesArr,
        tags: tagsArr,
        isBestSeller: formData.isBestSeller,
        isNewArrival: formData.isNewArrival,
        isOrganic: formData.isOrganic,
      });

      if (updated) {
        addToast('success', 'Product Updated', `"${updated.name}" updated successfully.`);
      }
    } else {
      // Create
      const newProduct = db.addProduct({
        name: formData.name.trim(),
        subtitle: formData.subtitle.trim(),
        sku: formData.sku.trim() || generateSKU('HZ'),
        categoryId: formData.categoryId,
        categoryName,
        priceUSD: parseFloat(formData.priceUSD) || 0,
        salePriceUSD: formData.salePriceUSD ? parseFloat(formData.salePriceUSD) : undefined,
        stockQuantity: parseInt(formData.stockQuantity, 10) || 0,
        status: formData.status,
        description: formData.description.trim(),
        ingredients: formData.ingredients.trim(),
        howToUse: formData.howToUse.trim(),
        imageUrl: formData.imageUrl.trim() || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
        shades: shadesArr,
        tags: tagsArr,
        rating: 5.0,
        reviewsCount: 0,
        isBestSeller: formData.isBestSeller,
        isNewArrival: formData.isNewArrival,
        isOrganic: formData.isOrganic,
      });

      addToast('success', 'Product Created', `"${newProduct.name}" added to catalog.`);
    }

    setIsAddEditOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    const success = db.deleteProduct(id);
    if (success) {
      addToast('success', 'Product Deleted', 'SKU removed from catalog.');
    }
  };

  const handleDuplicate = (p: Product) => {
    const { id, createdAt, updatedAt, ...rest } = p;
    const duplicated = db.addProduct({
      ...rest,
      name: `${p.name} (Copy)`,
      sku: generateSKU('HZ'),
    });
    addToast('info', 'Product Duplicated', `Created duplicate "${duplicated.name}".`);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    let count = 0;
    selectedIds.forEach(id => {
      if (db.deleteProduct(id)) count++;
    });
    setSelectedIds([]);
    addToast('success', 'Bulk Delete Complete', `Removed ${count} products.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Action Bar */}
      <div className="p-6 rounded-2xl bg-white border border-[#EEEEEE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#B88E8D] text-xs font-semibold uppercase tracking-widest mb-1">
            <Package className="w-4 h-4" />
            <span>GLOBAL CATALOG MANAGEMENT</span>
          </div>
          <h2 className="text-2xl font-light text-[#1A1A1A]">Products & SKU Records</h2>
          <p className="text-xs text-[#999999] mt-1">
            Manage global inventory, prices, active status, shades, and categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setBulkDeleteConfirmOpen(true)}
              className="px-4 py-2.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold flex items-center gap-2 hover:bg-rose-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-full bg-[#1A1A1A] hover:bg-[#333333] text-white text-xs font-medium uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#B88E8D]" />
            <span>ADD NEW SKU</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Panel */}
      <div className="p-5 rounded-2xl bg-white border border-[#EEEEEE] shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999999]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search product name, SKU, or tag..."
              className="w-full bg-[#FAFAFA] border border-[#EEEEEE] text-[#1A1A1A] text-xs rounded-full pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#B88E8D]"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#FAFAFA] border border-[#EEEEEE] text-[#1A1A1A] text-xs rounded-full px-3 py-2.5 focus:outline-none focus:border-[#B88E8D] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#FAFAFA] border border-[#EEEEEE] text-[#1A1A1A] text-xs rounded-full px-3 py-2.5 focus:outline-none focus:border-[#B88E8D] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={selectedStockStatus}
              onChange={(e) => {
                setSelectedStockStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#FAFAFA] border border-[#EEEEEE] text-[#1A1A1A] text-xs rounded-full px-3 py-2.5 focus:outline-none focus:border-[#B88E8D] cursor-pointer"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock (&gt;15)</option>
              <option value="low_stock">Low Stock (1-15)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-white border border-[#EEEEEE] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1A1A1A]">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#EEEEEE]">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={paginatedProducts.length > 0 && selectedIds.length === paginatedProducts.length}
                    className="rounded border-[#EEEEEE] accent-[#B88E8D]"
                  />
                </th>
                <th className="py-3.5 px-4 text-[10px] uppercase tracking-widest font-semibold text-[#999999]">Item / SKU</th>
                <th className="py-3.5 px-4 text-[10px] uppercase tracking-widest font-semibold text-[#999999]">Category</th>
                <th className="py-3.5 px-4 text-[10px] uppercase tracking-widest font-semibold text-[#999999]">Price</th>
                <th className="py-3.5 px-4 text-[10px] uppercase tracking-widest font-semibold text-[#999999]">Stock</th>
                <th className="py-3.5 px-4 text-[10px] uppercase tracking-widest font-semibold text-[#999999]">Status</th>
                <th className="py-3.5 px-4 text-[10px] uppercase tracking-widest font-semibold text-[#999999] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEEEE]">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#999999]">
                    <Package className="w-8 h-8 mx-auto mb-2 text-[#999999]" />
                    <p className="text-sm font-medium">No products match your filters</p>
                    <p className="text-xs mt-1">Try clearing filters or adding a new SKU.</p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-[#FAFAFA] transition-colors ${isSelected ? 'bg-amber-50/20' : ''}`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(p.id)}
                          className="rounded border-[#EEEEEE] accent-[#B88E8D]"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover border border-[#EEEEEE] shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-[#1A1A1A] line-clamp-1">{p.name}</p>
                            <p className="text-[10px] text-[#999999] font-mono mt-0.5">SKU: {p.sku}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#999999]">
                        <span className="px-2.5 py-1 rounded-full bg-[#FAFAFA] border border-[#EEEEEE] text-[11px]">
                          {p.categoryName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[#1A1A1A]">
                        {formatCurrency(p.priceUSD, currency)}
                        {p.salePriceUSD && (
                          <span className="text-[10px] text-rose-500 line-through ml-1.5 font-normal">
                            {formatCurrency(p.salePriceUSD, currency)}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.stockQuantity === 0
                              ? 'bg-rose-50 text-rose-600'
                              : p.stockQuantity <= 15
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {p.stockQuantity === 0 ? 'Out of Stock' : `${p.stockQuantity} in stock`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            p.status === 'active'
                              ? 'bg-emerald-50 text-emerald-600'
                              : p.status === 'draft'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-stone-100 text-[#999999]'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingProduct(p)}
                            className="p-1.5 rounded-full hover:bg-[#F5F5F5] text-[#999999] hover:text-[#1A1A1A]"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(p)}
                            className="p-1.5 rounded-full hover:bg-[#F5F5F5] text-[#999999] hover:text-[#1A1A1A]"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-full hover:bg-[#F5F5F5] text-[#999999] hover:text-[#B88E8D]"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="p-1.5 rounded-full hover:bg-rose-50 text-[#999999] hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredProducts.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Add / Edit Product Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white text-[#1A1A1A] rounded-2xl border border-[#EEEEEE] shadow-2xl p-6 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEEEEE]">
              <h3 className="text-lg font-semibold text-[#1A1A1A]">
                {editingProduct ? 'Edit Product SKU' : 'Add New Product SKU'}
              </h3>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="p-1.5 rounded-full text-[#999999] hover:text-[#1A1A1A] hover:bg-[#F5F5F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#999999] mb-1 font-semibold">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Kashmir Saffron Glow Serum"
                    className="w-full bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl px-3 py-2 text-[#1A1A1A] focus:outline-none focus:border-[#B88E8D]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#999999] mb-1 font-semibold">
                    Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="e.g., Pure Saffron & Rose Elixir"
                    className="w-full bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl px-3 py-2 text-[#1A1A1A] focus:outline-none focus:border-[#B88E8D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#999999] mb-1 font-semibold">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl px-3 py-2 text-[#1A1A1A] font-mono focus:outline-none focus:border-[#B88E8D]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#999999] mb-1 font-semibold">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl px-3 py-2 text-[#1A1A1A] focus:outline-none focus:border-[#B88E8D]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#999999] mb-1 font-semibold">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
                    className="w-full bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl px-3 py-2 text-[#1A1A1A] focus:outline-none focus:border-[#B88E8D]"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#999999] mb-1 font-semibold">
                    Price (USD $) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.priceUSD}
                    onChange={(e) => setFormData({ ...formData, priceUSD: e.target.value })}
                    placeholder="85.00"
                    className="w-full bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl px-3 py-2 text-[#1A1A1A] focus:outline-none focus:border-[#B88E8D]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#999999] mb-1 font-semibold">
                    Original / Sale Price (USD $)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salePriceUSD}
                    onChange={(e) => setFormData({ ...formData, salePriceUSD: e.target.value })}
                    placeholder="100.00"
                    className="w-full bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl px-3 py-2 text-[#1A1A1A] focus:outline-none focus:border-[#B88E8D]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#999999] mb-1 font-semibold">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    placeholder="50"
                    className="w-full bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl px-3 py-2 text-[#1A1A1A] focus:outline-none focus:border-[#B88E8D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#999999] mb-1 font-semibold">
                  Image URL
                </label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl px-3 py-2 text-[#1A1A1A] focus:outline-none focus:border-[#B88E8D]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#999999] mb-1 font-semibold">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed product story, texture, benefits..."
                  className="w-full bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl px-3 py-2 text-[#1A1A1A] focus:outline-none focus:border-[#B88E8D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#999999] mb-1 font-semibold">
                    Shades / Variants (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={formData.shadesInput}
                    onChange={(e) => setFormData({ ...formData, shadesInput: e.target.value })}
                    placeholder="Velvet Rose, Crimson Gold"
                    className="w-full bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl px-3 py-2 text-[#1A1A1A] focus:outline-none focus:border-[#B88E8D]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#999999] mb-1 font-semibold">
                    Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tagsInput}
                    onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
                    placeholder="Saffron, Organic, Best Seller"
                    className="w-full bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl px-3 py-2 text-[#1A1A1A] focus:outline-none focus:border-[#B88E8D]"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isBestSeller}
                    onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                    className="rounded border-[#EEEEEE] accent-[#B88E8D]"
                  />
                  <span>Best Seller Badge</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isNewArrival}
                    onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                    className="rounded border-[#EEEEEE] accent-[#B88E8D]"
                  />
                  <span>New Arrival Badge</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isOrganic}
                    onChange={(e) => setFormData({ ...formData, isOrganic: e.target.checked })}
                    className="rounded border-[#EEEEEE] accent-[#B88E8D]"
                  />
                  <span>Organic Certified</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EEEEEE]">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#EEEEEE] text-[#1A1A1A] hover:bg-[#F5F5F5] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#1A1A1A] hover:bg-[#333333] text-white font-medium shadow-xs"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#EEEEEE] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={viewingProduct.imageUrl}
                  alt={viewingProduct.name}
                  className="w-16 h-16 rounded-xl object-cover border border-[#EEEEEE]"
                />
                <div>
                  <h3 className="text-base font-semibold text-[#1A1A1A]">{viewingProduct.name}</h3>
                  <p className="text-xs text-[#999999]">{viewingProduct.subtitle}</p>
                  <p className="text-[10px] text-[#B88E8D] font-mono mt-0.5">SKU: {viewingProduct.sku}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="p-1 rounded-full text-[#999999] hover:text-[#1A1A1A] hover:bg-[#F5F5F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#1A1A1A] leading-relaxed bg-[#FAFAFA] p-3 rounded-xl border border-[#EEEEEE]">
              {viewingProduct.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#EEEEEE]">
                <span className="text-[10px] text-[#999999] uppercase font-semibold block">Price</span>
                <span className="font-bold text-[#1A1A1A]">{formatCurrency(viewingProduct.priceUSD, currency)}</span>
              </div>
              <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#EEEEEE]">
                <span className="text-[10px] text-[#999999] uppercase font-semibold block">Stock</span>
                <span className="font-bold text-[#1A1A1A]">{viewingProduct.stockQuantity} units</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingProduct(null)}
                className="px-5 py-2 rounded-full bg-[#1A1A1A] text-white text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={!!deleteConfirmId}
        title="Delete Product SKU?"
        message="Are you sure you want to remove this product from the central catalog?"
        confirmLabel="Yes, Delete SKU"
        variant="danger"
        onConfirm={() => deleteConfirmId && handleDeleteProduct(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
      />

      <ConfirmationModal
        isOpen={bulkDeleteConfirmOpen}
        title={`Delete ${selectedIds.length} Products?`}
        message={`Are you sure you want to permanently delete these ${selectedIds.length} selected items from LocalStorage?`}
        confirmLabel="Delete Selected"
        variant="danger"
        onConfirm={handleBulkDelete}
        onClose={() => setBulkDeleteConfirmOpen(false)}
      />
    </div>
  );
};
