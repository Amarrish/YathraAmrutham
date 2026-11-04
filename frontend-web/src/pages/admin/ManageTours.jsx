import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { RegisteredUsersModal } from '../../components/RegisteredUsersModal';
import { SeatAlignmentDesigner } from '../../components/SeatAlignmentDesigner';
import {
  Compass,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Bus,
  Users,
  MapPin,
  CheckCircle,
  AlertTriangle,
  X,
  CheckCheck,
  RotateCcw,
  LayoutGrid,
  FileText
} from 'lucide-react';

export const ManageTours = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Tab: 'Active' or 'Completed'
  const [activeTab, setActiveTab] = useState('Active');

  // Registered users manifest modal
  const [selectedTourIdForManifest, setSelectedTourIdForManifest] = useState(null);

  const vehicleOptions = [
    'Volvo Multi-Axle Bus',
    'Force Tempo Traveller (12/17 Seater)',
    'Toyota Innova Crysta SUV',
    'Luxury AC Sleeper Coach',
    'Urbania Premium Van',
    'Custom Tourist Coach'
  ];

  const defaultForm = {
    title: '',
    description: '',
    destination: '',
    startLocation: '',
    startDate: '',
    endDate: '',
    pricePerPerson: '',
    totalSeats: 30,
    availableSeats: 30,
    vehicleType: 'Volvo Multi-Axle Bus',
    inclusions: '',
    exclusions: '',
    imageUrl: '',
    seatingGrid: null
  };

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    setLoading(true);
    try {
      // fetch all tours including active, completed, full
      const res = await api.get('/tours?status=all');
      if (res.data.success) {
        setTours(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching tours:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingTour(null);
    setFormData(defaultForm);
    setModalOpen(true);
    setError('');
  };

  const handleOpenEdit = (tour) => {
    setEditingTour(tour);
    setFormData({
      title: tour.title,
      description: tour.description,
      destination: tour.destination,
      startLocation: tour.startLocation,
      startDate: tour.startDate ? new Date(tour.startDate).toISOString().slice(0, 10) : '',
      endDate: tour.endDate ? new Date(tour.endDate).toISOString().slice(0, 10) : '',
      pricePerPerson: tour.pricePerPerson,
      totalSeats: tour.totalSeats,
      availableSeats: tour.availableSeats,
      vehicleType: tour.vehicleType,
      inclusions: tour.inclusions?.join(', ') || '',
      exclusions: tour.exclusions?.join(', ') || '',
      imageUrl: tour.images?.[0] || '',
      seatingGrid: tour.seatingGrid || null
    });
    setModalOpen(true);
    setError('');
  };

  const handleToggleStatus = async (tour, newStatus) => {
    const actionName = newStatus === 'Completed' ? 'complete' : 'reopen as active';
    if (!window.confirm(`Are you sure you want to ${actionName} this tour: "${tour.title}"?`)) {
      return;
    }

    try {
      const res = await api.put(`/tours/${tour._id}/status`, { status: newStatus });
      if (res.data.success) {
        setMessage(res.data.message);
        fetchTours();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating tour status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tour?')) return;
    try {
      const res = await api.delete(`/tours/${id}`);
      if (res.data.success) {
        setMessage(res.data.message);
        fetchTours();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete tour.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      title: formData.title,
      description: formData.description,
      destination: formData.destination,
      startLocation: formData.startLocation,
      startDate: formData.startDate,
      endDate: formData.endDate,
      pricePerPerson: Number(formData.pricePerPerson),
      totalSeats: Number(formData.totalSeats),
      availableSeats:
        formData.availableSeats !== ''
          ? Number(formData.availableSeats)
          : Number(formData.totalSeats),
      vehicleType: formData.vehicleType,
      inclusions: formData.inclusions.split(',').map((s) => s.trim()).filter(Boolean),
      exclusions: formData.exclusions.split(',').map((s) => s.trim()).filter(Boolean),
      images: formData.imageUrl ? [formData.imageUrl] : [],
      seatingGrid: formData.seatingGrid || undefined
    };

    try {
      if (editingTour) {
        const res = await api.put(`/tours/${editingTour._id}`, payload);
        if (res.data.success) {
          setMessage('Tour updated successfully!');
          setModalOpen(false);
          fetchTours();
        }
      } else {
        const res = await api.post('/tours', payload);
        if (res.data.success) {
          setMessage('New tour created successfully!');
          setModalOpen(false);
          fetchTours();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving tour.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filter tours
  const activeTours = tours.filter((t) => t.status !== 'Completed');
  const completedTours = tours.filter((t) => t.status === 'Completed');
  const displayedTours = activeTab === 'Active' ? activeTours : completedTours;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Manage Tour Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize Active vs Completed tours (Kerala, Tamil Nadu, Karnataka), design vehicle seating alignments, and export passenger manifests.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Tour</span>
        </button>
      </div>

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
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs: Active Tours vs. Completed Tours */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('Active')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'Active'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span>Active Tours</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/40 font-black">
            {activeTours.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('Completed')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'Completed'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span>Completed Tours</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/40 font-black">
            {completedTours.length}
          </span>
        </button>
      </div>

      {/* Tours Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Tour Title & Destination</th>
                <th className="py-3.5 px-4">Dates & Pickup Point</th>
                <th className="py-3.5 px-4">Vehicle & Alignment</th>
                <th className="py-3.5 px-4">Available / Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Loading tours...
                  </td>
                </tr>
              ) : displayedTours.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No {activeTab.toLowerCase()} tours found.
                  </td>
                </tr>
              ) : (
                displayedTours.map((tour) => (
                  <tr key={tour._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block text-sm">{tour.title}</span>
                      <span className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-rose-500" /> {tour.destination}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5 text-slate-700">
                      <div>
                        <strong>Dep:</strong> {formatDate(tour.startDate)}
                      </div>
                      <div>
                        <strong>Ret:</strong> {formatDate(tour.endDate)}
                      </div>
                      <div className="text-[11px] text-slate-400">Pickup: {tour.startLocation}</div>
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      <span className="px-2.5 py-1 bg-sky-50 text-sky-800 rounded-lg font-semibold inline-flex items-center gap-1 border border-sky-100">
                        <Bus className="w-3 h-3 text-sky-600" />
                        {tour.vehicleType}
                      </span>
                      {tour.seatingGrid?.rows && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Grid: {tour.seatingGrid.rows}R × {tour.seatingGrid.columns}C
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        <span className={tour.availableSeats <= 3 ? 'text-amber-600' : 'text-emerald-700'}>
                          {tour.availableSeats}
                        </span>{' '}
                        / {tour.totalSeats} seats
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ₹{tour.pricePerPerson.toLocaleString()} / seat
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          tour.status === 'Completed'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : tour.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {tour.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* View Registered Users Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedTourIdForManifest(tour._id)}
                          className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-lg border border-sky-200 transition-colors flex items-center gap-1"
                          title="View Registered Users & Download Manifest"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Registered Users</span>
                        </button>

                        {/* View Seating Chart */}
                        <Link
                          to={`/admin/seat-chart/${tour._id}`}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          title="Open Live Seating Chart"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                        </Link>

                        {/* Mark Completed or Reopen */}
                        {tour.status !== 'Completed' ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(tour, 'Completed')}
                            className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 transition-colors"
                            title="Mark Tour as Completed"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(tour, 'Active')}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors"
                            title="Reopen Tour as Active"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(tour)}
                          title="Edit Tour"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(tour._id)}
                          title="Delete Tour"
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add or Edit Tour */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 my-8 overflow-hidden">
            <div className="bg-amber-500 px-6 py-4 text-slate-950 flex items-center justify-between font-black">
              <h3>{editingTour ? 'Edit Tour Details' : 'Add New Tour'}</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-amber-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tour Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Kerala Backwaters & Munnar Hills Expedition"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Destination & Start Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Destination *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="e.g. Kerala / Tamil Nadu / Karnataka"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Start Location (Pickup Point) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.startLocation}
                    onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
                    placeholder="e.g. Kochi Central Terminal"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Departure Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Return Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Vehicle Type & Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Vehicle Type *
                  </label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {vehicleOptions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tour Fee Per Seat (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.pricePerPerson}
                    onChange={(e) => setFormData({ ...formData, pricePerPerson: e.target.value })}
                    placeholder="e.g. 8500"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* ── Interactive Seat Alignment Grid Designer ─────────── */}
              <SeatAlignmentDesigner
                initialGrid={formData.seatingGrid}
                onChange={(gridData) => {
                  setFormData((prev) => ({
                    ...prev,
                    seatingGrid: {
                      rows: gridData.rows,
                      columns: gridData.columns,
                      cells: gridData.cells
                    },
                    totalSeats: gridData.totalSeats,
                    availableSeats:
                      prev.availableSeats && prev.availableSeats < gridData.totalSeats
                        ? prev.availableSeats
                        : gridData.totalSeats
                  }));
                }}
              />

              {/* Seats Manual Override if needed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Total Seats (Auto-calculated from alignment)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.totalSeats}
                    onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Available Seats
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.availableSeats}
                    onChange={(e) => setFormData({ ...formData, availableSeats: e.target.value })}
                    placeholder="Defaults to Total Seats"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Overview of the journey, scenery, and highlights..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Inclusions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Inclusions (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.inclusions}
                  onChange={(e) => setFormData({ ...formData, inclusions: e.target.value })}
                  placeholder="3-Star Hotel Stay, Daily Breakfast, Volvo Transit"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Banner Image URL
                </label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md"
                >
                  {editingTour ? 'Save Changes' : 'Create Tour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registered Users Manifest Modal */}
      <RegisteredUsersModal
        tourId={selectedTourIdForManifest}
        isOpen={Boolean(selectedTourIdForManifest)}
        onClose={() => setSelectedTourIdForManifest(null)}
      />
    </div>
  );
};
