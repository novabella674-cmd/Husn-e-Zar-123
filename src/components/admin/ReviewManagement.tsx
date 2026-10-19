import React, { useState, useMemo } from 'react';
import { Review, ReviewStatus, Product } from '../../types';
import { db } from '../../utils/storage';
import { formatDate } from '../../utils/formatters';
import { Pagination } from '../common/Pagination';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { 
  Star, Search, Plus, Edit, Trash2, CheckCircle, XCircle, MessageSquare, X
} from 'lucide-react';

interface Props {
  reviews: Review[];
  products: Product[];
  addToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const ReviewManagement: React.FC<Props> = ({
  reviews,
  products,
  addToast,
}) => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    productId: '',
    customerName: '',
    customerEmail: '',
    rating: 5,
    title: '',
    comment: '',
    status: 'Approved' as ReviewStatus,
    adminReply: '',
  });

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.productName.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q);

      const matchStatus = selectedStatus === 'all' || r.status === selectedStatus;
      const matchRating = selectedRating === 'all' || r.rating === parseInt(selectedRating, 10);

      return matchSearch && matchStatus && matchRating;
    });
  }, [reviews, search, selectedStatus, selectedRating]);

  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReviews.slice(start, start + pageSize);
  }, [filteredReviews, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredReviews.length / pageSize) || 1;

  const handleOpenAdd = () => {
    const defaultProd = products[0] || { id: 'prod-101', name: 'Zafran Gold Elixir' };
    setEditingReview(null);
    setFormData({
      productId: defaultProd.id,
      customerName: '',
      customerEmail: '',
      rating: 5,
      title: 'Royal Quality!',
      comment: '',
      status: 'Approved',
      adminReply: '',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (r: Review) => {
    setEditingReview(r);
    setFormData({
      productId: r.productId,
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      status: r.status,
      adminReply: r.adminReply || '',
    });
    setIsAddEditOpen(true);
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName.trim() || !formData.comment.trim()) {
      addToast('error', 'Validation Error', 'Customer name and comment text are required.');
      return;
    }

    const prod = products.find((p) => p.id === formData.productId) || {
      id: formData.productId,
      name: 'Husn-e-Zar Product',
    };

    if (editingReview) {
      db.updateReview(editingReview.id, {
        rating: formData.rating,
        title: formData.title.trim(),
        comment: formData.comment.trim(),
        status: formData.status,
        adminReply: formData.adminReply.trim() || undefined,
      });
      addToast('success', 'Review Saved', 'Customer review updated.');
    } else {
      db.addReview({
        productId: prod.id,
        productName: prod.name,
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim() || 'customer@example.com',
        rating: formData.rating,
        title: formData.title.trim(),
        comment: formData.comment.trim(),
        verifiedPurchase: true,
        status: formData.status,
        adminReply: formData.adminReply.trim() || undefined,
      });
      addToast('success', 'Review Logged', 'New review added to catalog.');
    }

    setIsAddEditOpen(false);
  };

  const handleDeleteReview = (id: string) => {
    const success = db.deleteReview(id);
    if (success) {
      addToast('success', 'Review Deleted', 'Review removed.');
    }
  };

  const handleStatusChange = (r: Review, newStatus: ReviewStatus) => {
    db.updateReview(r.id, { status: newStatus });
    addToast('info', 'Review Moderated', `Set review status to ${newStatus}.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-stone-900 border border-stone-800 shadow-md">
        <div>
          <h2 className="text-xl font-serif font-bold text-amber-100 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span>Customer Reviews & Ratings Moderation</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Approve, edit, or respond to client product ratings and feedback.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all shadow-md cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Manual Review</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, reviewer, title..."
            className="w-full bg-stone-950 border border-stone-800 text-stone-200 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:border-amber-500"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-xl px-3 py-2.5"
        >
          <option value="all">All Moderation Statuses</option>
          <option value="Approved">Approved Only</option>
          <option value="Pending">Pending Moderation</option>
          <option value="Flagged">Flagged</option>
        </select>

        <select
          value={selectedRating}
          onChange={(e) => setSelectedRating(e.target.value)}
          className="bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-xl px-3 py-2.5"
        >
          <option value="all">All Star Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      {/* Reviews Table */}
      <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow-md">
        {paginatedReviews.length === 0 ? (
          <div className="py-12 text-center text-stone-400 space-y-3">
            <Star className="w-12 h-12 text-stone-600 mx-auto stroke-1" />
            <p className="text-base font-serif font-semibold text-stone-300">No reviews found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="text-[11px] uppercase tracking-wider text-stone-500 bg-stone-950/60 border-b border-stone-800">
                <tr>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Rating</th>
                  <th className="py-3 px-3">Review & Admin Reply</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {paginatedReviews.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-stone-100 max-w-xs">
                      {r.productName}
                    </td>

                    <td className="py-3 px-3 text-stone-300">
                      <p className="font-bold">{r.customerName}</p>
                      <p className="text-[10px] text-stone-500">{formatDate(r.createdAt)}</p>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-700'
                            }`}
                          />
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3 max-w-md">
                      <p className="font-bold text-stone-100">{r.title}</p>
                      <p className="text-stone-300 line-clamp-2 mt-0.5">{r.comment}</p>
                      {r.adminReply && (
                        <div className="mt-2 p-2 rounded-lg bg-stone-950 border border-amber-900/40 text-[11px] text-amber-200">
                          <strong className="text-amber-400">Brand Reply: </strong> {r.adminReply}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'Approved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        r.status === 'Pending' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-rose-950 text-rose-300'
                      }`}>
                        {r.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.status !== 'Approved' && (
                          <button
                            onClick={() => handleStatusChange(r, 'Approved')}
                            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-950"
                            title="Approve Review"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800"
                          title="Edit & Reply"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(r.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800"
                          title="Delete Review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredReviews.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Edit / Reply Modal */}
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
              {editingReview ? 'Moderate Review & Reply' : 'Add Manual Review'}
            </h3>

            <form onSubmit={handleSaveReview} className="space-y-3 text-xs mt-4">
              {!editingReview && (
                <div>
                  <label className="block font-medium text-stone-300 mb-1">Select Product *</label>
                  <select
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-300 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-300 mb-1">Star Rating</label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                  >
                    <option value={5}>5 Stars (Exceptional)</option>
                    <option value={4}>4 Stars (Very Good)</option>
                    <option value={3}>3 Stars (Average)</option>
                    <option value={2}>2 Stars (Poor)</option>
                    <option value={1}>1 Star (Unsatisfied)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-300 mb-1">Review Headline</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-300 mb-1">Review Content *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                />
              </div>

              <div>
                <label className="block font-medium text-amber-200 mb-1">Official Brand Reply</label>
                <textarea
                  rows={2}
                  value={formData.adminReply}
                  onChange={(e) => setFormData({ ...formData, adminReply: e.target.value })}
                  placeholder="e.g. Thank you Fatima! We are thrilled that you love the Zafran Elixir."
                  className="w-full bg-stone-950 border border-amber-900/50 rounded-xl p-2.5 text-stone-100 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-300 mb-1">Moderation Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ReviewStatus })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-stone-100"
                >
                  <option value="Approved">Approved (Public)</option>
                  <option value="Pending">Pending Moderation</option>
                  <option value="Flagged">Flagged / Hidden</option>
                </select>
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
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmationModal
        isOpen={!!deleteConfirmId}
        title="Delete Review?"
        message="Are you sure you want to delete this customer review permanently?"
        confirmLabel="Delete Review"
        onConfirm={() => deleteConfirmId && handleDeleteReview(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
