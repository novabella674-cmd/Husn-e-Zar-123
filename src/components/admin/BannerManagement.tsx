import React, { useState } from 'react';
import { HeroBanner } from '../../types';
import { db } from '../../utils/storage';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { 
  Layers, Plus, Edit, Trash2, CheckCircle, XCircle, X, ArrowUp, ArrowDown
} from 'lucide-react';

interface Props {
  banners: HeroBanner[];
  addToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const BannerManagement: React.FC<Props> = ({
  banners,
  addToast,
}) => {
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    tag: 'Royal Heritage',
    ctaText: 'Explore Collection',
    ctaCategorySlug: 'skincare',
    imageUrl: '',
    isActive: true,
    displayOrder: 1,
  });

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      tag: 'Royal Heritage',
      ctaText: 'Explore Collection',
      ctaCategorySlug: 'skincare',
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1600',
      isActive: true,
      displayOrder: banners.length + 1,
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (b: HeroBanner) => {
    setEditingBanner(b);
    setFormData({
      title: b.title,
      subtitle: b.subtitle,
      tag: b.tag,
      ctaText: b.ctaText,
      ctaCategorySlug: b.ctaCategorySlug,
      imageUrl: b.imageUrl,
      isActive: b.isActive,
      displayOrder: b.displayOrder,
    });
    setIsAddEditOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      addToast('error', 'Validation Error', 'Banner Title is required.');
      return;
    }

    if (editingBanner) {
      db.updateBanner(editingBanner.id, {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        tag: formData.tag.trim(),
        ctaText: formData.ctaText.trim(),
        ctaCategorySlug: formData.ctaCategorySlug.trim(),
        imageUrl: formData.imageUrl.trim(),
        isActive: formData.isActive,
        displayOrder: Number(formData.displayOrder),
      });
      addToast('success', 'Banner Saved', 'Hero banner slideshow updated.');
    } else {
      db.addBanner({
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        tag: formData.tag.trim(),
        ctaText: formData.ctaText.trim(),
        ctaCategorySlug: formData.ctaCategorySlug.trim(),
        imageUrl: formData.imageUrl.trim() || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1600',
        isActive: formData.isActive,
        displayOrder: Number(formData.displayOrder),
      });
      addToast('success', 'Banner Added', 'New hero banner published.');
    }

    setIsAddEditOpen(false);
  };

  const handleDeleteBanner = (id: string) => {
    const success = db.deleteBanner(id);
    if (success) {
      addToast('success', 'Banner Deleted', 'Banner removed from slideshow.');
    }
  };

  const handleToggleActive = (b: HeroBanner) => {
    db.updateBanner(b.id, { isActive: !b.isActive });
    addToast('info', 'Banner Status', `Banner is now ${!b.isActive ? 'Active' : 'Disabled'}.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-stone-900 border border-stone-800 shadow-md">
        <div>
          <h2 className="text-xl font-serif font-bold text-amber-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>Storefront Hero Banners & Slideshow</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Manage high-impact landing visual slides, promotional taglines, and featured buttons.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all shadow-md cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Banner Slide</span>
        </button>
      </div>

      {/* Banners List */}
      <div className="space-y-4">
        {banners.map((b) => (
          <div
            key={b.id}
            className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col md:flex-row items-center gap-4 shadow-md hover:border-amber-900/50 transition-all"
          >
            <img
              src={b.imageUrl}
              alt={b.title}
              className="w-full md:w-48 h-28 rounded-xl object-cover border border-stone-800"
            />

            <div className="flex-1 space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-400 px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-800/40">
                {b.tag}
              </span>
              <h3 className="text-base font-serif font-bold text-stone-100">{b.title}</h3>
              <p className="text-xs text-stone-400 line-clamp-2">{b.subtitle}</p>
              <div className="text-[11px] text-stone-500 pt-1">
                CTA Button: <strong className="text-stone-300">{b.ctaText}</strong> → /{b.ctaCategorySlug}
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-center">
              <button
                onClick={() => handleToggleActive(b)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                  b.isActive
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-stone-800 text-stone-400'
                }`}
              >
                {b.isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>{b.isActive ? 'Active' : 'Disabled'}</span>
              </button>

              <button
                onClick={() => handleOpenEdit(b)}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300"
              >
                <Edit className="w-4 h-4" />
              </button>

              <button
                onClick={() => setDeleteConfirmId(b.id)}
                className="p-2 rounded-xl bg-stone-800 hover:bg-rose-950 text-stone-300 hover:text-rose-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-stone-900 text-stone-100 rounded-2xl border border-stone-800 shadow-2xl p-6">
            <button
              onClick={() => setIsAddEditOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-serif font-bold text-amber-100 mb-1">
              {editingBanner ? 'Edit Hero Banner' : 'Create Banner Slide'}
            </h3>

            <form onSubmit={handleSaveBanner} className="space-y-3 text-xs mt-4">
              <div>
                <label className="block font-medium text-stone-300 mb-1">Banner Tag / Eyebrow *</label>
                <input
                  type="text"
                  required
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  placeholder="e.g. Royal Heritage"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-300 mb-1">Main Heading Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. The Zafran Gold Collection"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-300 mb-1">Subtitle / Summary</label>
                <textarea
                  rows={2}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-300 mb-1">Button CTA Text</label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    placeholder="e.g. Shop Now"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-300 mb-1">Target Category Slug</label>
                  <input
                    type="text"
                    value={formData.ctaCategorySlug}
                    onChange={(e) => setFormData({ ...formData, ctaCategorySlug: e.target.value })}
                    placeholder="e.g. skincare"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-300 mb-1">High-Res Background Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
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
                  <span>Active in Storefront Slideshow</span>
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
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!deleteConfirmId}
        title="Delete Banner Slide?"
        message="Are you sure you want to remove this banner from the homepage carousel?"
        confirmLabel="Delete Banner"
        onConfirm={() => deleteConfirmId && handleDeleteBanner(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
