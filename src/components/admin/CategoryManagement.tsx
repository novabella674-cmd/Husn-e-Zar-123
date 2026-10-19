import React, { useState } from 'react';
import { Category, Product } from '../../types';
import { db } from '../../utils/storage';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { 
  FolderTree, Plus, Edit, Trash2, CheckCircle, XCircle, X
} from 'lucide-react';

interface Props {
  categories: Category[];
  products: Product[];
  addToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const CategoryManagement: React.FC<Props> = ({
  categories,
  products,
  addToast,
}) => {
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    isActive: true,
    displayOrder: 1,
  });

  const handleOpenAdd = () => {
    setEditingCat(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=800',
      isActive: true,
      displayOrder: categories.length + 1,
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCat(c);
    setFormData({
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      imageUrl: c.imageUrl || '',
      isActive: c.isActive,
      displayOrder: c.displayOrder || 1,
    });
    setIsAddEditOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      addToast('error', 'Validation Error', 'Category Name is required.');
      return;
    }

    const slug = formData.slug.trim().toLowerCase().replace(/\s+/g, '-') || formData.name.trim().toLowerCase().replace(/\s+/g, '-');

    if (editingCat) {
      db.updateCategory(editingCat.id, {
        name: formData.name.trim(),
        slug,
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim(),
        isActive: formData.isActive,
        displayOrder: Number(formData.displayOrder),
      });
      addToast('success', 'Category Updated', `${formData.name} updated.`);
    } else {
      db.addCategory({
        name: formData.name.trim(),
        slug,
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim() || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=800',
        isActive: formData.isActive,
        displayOrder: Number(formData.displayOrder),
      });
      addToast('success', 'Category Added', `${formData.name} created.`);
    }

    setIsAddEditOpen(false);
  };

  const handleDeleteCategory = (id: string) => {
    // Check if products exist in category
    const count = products.filter(p => p.categoryId === id).length;
    if (count > 0) {
      addToast('error', 'Cannot Delete Category', `There are ${count} products assigned to this category. Please reassign or delete those products first.`);
      return;
    }

    const success = db.deleteCategory(id);
    if (success) {
      addToast('success', 'Category Deleted', 'Category removed.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-stone-900 border border-stone-800 shadow-md">
        <div>
          <h2 className="text-xl font-serif font-bold text-amber-100 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-amber-400" />
            <span>Category & Collection Manager</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Organize catalog departments, banner image covers, and collection hierarchies.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all shadow-md cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => {
          const productCount = products.filter(p => p.categoryId === c.id).length;

          return (
            <div
              key={c.id}
              className="group relative rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden shadow-md hover:border-amber-900/50 transition-all flex flex-col justify-between"
            >
              <div className="relative h-36 overflow-hidden">
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-stone-950/80 backdrop-blur-xs text-[10px] font-mono text-amber-300 border border-stone-800">
                  /{c.slug}
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    c.isActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300'
                  }`}>
                    {c.isActive ? 'Active' : 'Hidden'}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-100">{c.name}</h3>
                  <p className="text-xs text-stone-400 mt-1 line-clamp-2">{c.description}</p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-3 border-t border-stone-800/80 text-xs">
                  <span className="font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/40">
                    {productCount} Products
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800"
                      title="Edit Category"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(c.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-stone-900 text-stone-100 rounded-2xl border border-stone-800 shadow-2xl p-6">
            <button
              onClick={() => setIsAddEditOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100 p-1 rounded-lg hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif font-bold text-amber-100 mb-1">
              {editingCat ? 'Edit Category' : 'Create New Collection'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs mt-4">
              <div>
                <label className="block font-medium text-stone-300 mb-1">Category Title *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Saffron Skincare"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-300 mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded-sm bg-stone-950 border-stone-700 text-amber-500 focus:ring-0"
                  />
                  <span>Visible in Store Navigation</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-700 text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!deleteConfirmId}
        title="Delete Category?"
        message="Are you sure you want to delete this category?"
        confirmLabel="Delete Category"
        onConfirm={() => deleteConfirmId && handleDeleteCategory(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
