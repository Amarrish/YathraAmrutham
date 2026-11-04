import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Image,
  Video,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  X,
  Upload,
  Play,
  Eye,
  Loader2,
  Compass,
  ArrowUpDown
} from 'lucide-react';

export const ManageGallery = () => {
  const [items, setItems] = useState([]);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'photo', 'video', 'upcoming'
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const defaultForm = {
    title: '',
    description: '',
    mediaType: 'photo',
    mediaUrl: '',
    thumbnailUrl: '',
    category: 'General',
    isUpcomingTourProgram: false,
    upcomingProgram: {
      tourTitle: '',
      destination: '',
      dates: '',
      itineraryBrief: '',
      relatedTourId: ''
    },
    order: 0
  };

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [galleryRes, toursRes] = await Promise.all([
        api.get('/gallery'),
        api.get('/tours')
      ]);

      if (galleryRes.data.success) {
        setItems(galleryRes.data.data);
      }
      if (toursRes.data.success) {
        setTours(toursRes.data.data);
      }
    } catch (err) {
      setError('Failed to load gallery items or tours.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData(defaultForm);
    setModalOpen(true);
    setError('');
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      description: item.description || '',
      mediaType: item.mediaType || 'photo',
      mediaUrl: item.mediaUrl || '',
      thumbnailUrl: item.thumbnailUrl || '',
      category: item.category || 'General',
      isUpcomingTourProgram: Boolean(item.isUpcomingTourProgram),
      upcomingProgram: {
        tourTitle: item.upcomingProgram?.tourTitle || '',
        destination: item.upcomingProgram?.destination || '',
        dates: item.upcomingProgram?.dates || '',
        itineraryBrief: item.upcomingProgram?.itineraryBrief || '',
        relatedTourId: item.upcomingProgram?.relatedTourId?._id || item.upcomingProgram?.relatedTourId || ''
      },
      order: item.order || 0
    });
    setModalOpen(true);
    setError('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const form = new FormData();
    form.append('image', file);

    try {
      const res = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setFormData((prev) => ({
          ...prev,
          mediaUrl: res.data.url,
          thumbnailUrl: prev.thumbnailUrl || res.data.url
        }));
      }
    } catch (err) {
      setError('Image upload failed. Please verify file format.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this gallery item?')) return;
    try {
      const res = await api.delete(`/gallery/${id}`);
      if (res.data.success) {
        setMessage('Gallery item deleted successfully.');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete gallery item.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.mediaUrl) {
      setError('Please provide a title and media URL.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      title: formData.title,
      description: formData.description,
      mediaType: formData.mediaType,
      mediaUrl: formData.mediaUrl,
      thumbnailUrl: formData.thumbnailUrl || formData.mediaUrl,
      category: formData.category,
      isUpcomingTourProgram: formData.isUpcomingTourProgram,
      upcomingProgram: formData.isUpcomingTourProgram
        ? {
            tourTitle: formData.upcomingProgram.tourTitle,
            destination: formData.upcomingProgram.destination,
            dates: formData.upcomingProgram.dates,
            itineraryBrief: formData.upcomingProgram.itineraryBrief,
            relatedTourId: formData.upcomingProgram.relatedTourId || undefined
          }
        : undefined,
      order: Number(formData.order) || 0
    };

    try {
      if (editingItem) {
        const res = await api.put(`/gallery/${editingItem._id}`, payload);
        if (res.data.success) {
          setMessage('Gallery item updated successfully.');
          setModalOpen(false);
          fetchData();
        }
      } else {
        const res = await api.post('/gallery', payload);
        if (res.data.success) {
          setMessage('Gallery item created successfully.');
          setModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save gallery item.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === 'photo') return item.mediaType === 'photo';
    if (activeTab === 'video') return item.mediaType === 'video';
    if (activeTab === 'upcoming') return item.isUpcomingTourProgram;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Visitor Gallery & Upcoming Programs Manager
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload showcase photos, video reels, and feature upcoming tour programs with booking links.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Media / Upcoming Program</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Gallery Items', val: items.length, icon: Image, cls: 'text-slate-900' },
          {
            label: 'Photos',
            val: items.filter((i) => i.mediaType === 'photo').length,
            icon: Image,
            cls: 'text-sky-600'
          },
          {
            label: 'Videos',
            val: items.filter((i) => i.mediaType === 'video').length,
            icon: Video,
            cls: 'text-purple-600'
          },
          {
            label: 'Upcoming Programs',
            val: items.filter((i) => i.isUpcomingTourProgram).length,
            icon: Sparkles,
            cls: 'text-amber-600'
          }
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between"
          >
            <div>
              <span className={`text-2xl font-black ${stat.cls}`}>{stat.val}</span>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{stat.label}</p>
            </div>
            <stat.icon className={`w-6 h-6 opacity-40 ${stat.cls}`} />
          </div>
        ))}
      </div>

      {/* Messages */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'all', label: 'All Items' },
          { id: 'photo', label: 'Photos' },
          { id: 'video', label: 'Videos' },
          { id: 'upcoming', label: 'Upcoming Programs' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Media Items Table / Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
          <p className="text-xs text-slate-500">Loading gallery items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <Image className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700 text-sm">No gallery items found in this section.</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700"
          >
            Upload First Item
          </button>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Preview</th>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Program / Tour</th>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="w-16 h-10 rounded-xl bg-slate-100 overflow-hidden relative border border-slate-200 flex-shrink-0">
                        <img
                          src={item.thumbnailUrl || item.mediaUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                        {item.mediaType === 'video' && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4 max-w-xs">
                      <span className="font-bold text-slate-900 block truncate">{item.title}</span>
                      {item.description && (
                        <span className="text-[11px] text-slate-500 block truncate">
                          {item.description}
                        </span>
                      )}
                    </td>

                    {/* Media Type */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.mediaType === 'video'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        {item.mediaType === 'video' ? '🎥 Video' : '📸 Photo'}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 font-semibold text-slate-700">{item.category}</td>

                    {/* Upcoming Program Flag */}
                    <td className="py-3 px-4">
                      {item.isUpcomingTourProgram ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                            <Sparkles className="w-2.5 h-2.5" /> Upcoming Program
                          </span>
                          {item.upcomingProgram?.dates && (
                            <div className="text-[10px] text-slate-500">
                              {item.upcomingProgram.dates}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Order */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">{item.order}</td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                          title="Edit Item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Item"
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
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 my-8 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-sky-950 px-6 py-4 text-white flex items-center justify-between flex-shrink-0">
              <h3 className="font-black text-base">
                {editingItem ? 'Edit Gallery Item' : 'Add New Gallery Item / Program'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold">
                  {error}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Item Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Backwaters Houseboat Cruise, Munnar Tea Gardens"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Brief description or highlight of this photo / video..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Media Type */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Media Type *
                  </label>
                  <select
                    value={formData.mediaType}
                    onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="photo">📸 Photo Image</option>
                    <option value="video">🎥 Video (YouTube / MP4)</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category (Tour Destination / Theme)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kerala, Tamil Nadu, Karnataka, Heritage"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Media URL with direct upload button */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Media URL (Direct Link, Cloud Image, or YouTube Video) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="https://... or upload below"
                    value={formData.mediaUrl}
                    onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />

                  <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                    ) : (
                      <Upload className="w-4 h-4 text-sky-600" />
                    )}
                    <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              {/* Thumbnail URL (especially for videos) */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Thumbnail Image URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Order index */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Display Order Priority
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                  className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Checkbox: Upcoming Tour Program */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isUpcomingTourProgram}
                    onChange={(e) =>
                      setFormData({ ...formData, isUpcomingTourProgram: e.target.checked })
                    }
                    className="h-4 w-4 rounded text-amber-600 border-amber-300 focus:ring-amber-500"
                  />
                  <span className="font-bold text-amber-950 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Mark this as an Upcoming Tour Program (shows dates, destination & booking link)
                  </span>
                </label>

                {formData.isUpcomingTourProgram && (
                  <div className="space-y-3 pt-2 border-t border-amber-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-amber-900 uppercase mb-1">
                          Tour Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Royal Karnataka Heritage Expedition"
                          value={formData.upcomingProgram.tourTitle}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              upcomingProgram: {
                                ...formData.upcomingProgram,
                                tourTitle: e.target.value
                              }
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-amber-900 uppercase mb-1">
                          Destination
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Mysore - Coorg - Hampi"
                          value={formData.upcomingProgram.destination}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              upcomingProgram: {
                                ...formData.upcomingProgram,
                                destination: e.target.value
                              }
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-amber-900 uppercase mb-1">
                          Program Dates
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 15 Nov – 20 Nov 2026"
                          value={formData.upcomingProgram.dates}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              upcomingProgram: {
                                ...formData.upcomingProgram,
                                dates: e.target.value
                              }
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-amber-900 uppercase mb-1">
                          Link to Active Tour for Booking
                        </label>
                        <select
                          value={formData.upcomingProgram.relatedTourId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              upcomingProgram: {
                                ...formData.upcomingProgram,
                                relatedTourId: e.target.value
                              }
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        >
                          <option value="">-- Optional: Link Tour --</option>
                          {tours.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.title} ({t.destination})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 uppercase mb-1">
                        Itinerary Brief / Program Summary
                      </label>
                      <textarea
                        rows="2"
                        placeholder="Key highlights of this program itinerary..."
                        value={formData.upcomingProgram.itineraryBrief}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            upcomingProgram: {
                              ...formData.upcomingProgram,
                              itineraryBrief: e.target.value
                            }
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:bg-slate-300"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingItem ? (
                    'Update Item'
                  ) : (
                    'Create Item'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
