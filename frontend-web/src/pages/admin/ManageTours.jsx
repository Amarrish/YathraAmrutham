import React, { useState, useEffect } from 'react';
import api from '../../api/client';
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
  X
} from 'lucide-react';

export const ManageTours = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    totalSeats: '',
    availableSeats: '',
    vehicleType: 'Force Tempo Traveller (12/17 Seater)',
    inclusions: '',
    exclusions: '',
    imageUrl: ''
  };

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      const res = await api.get('/tours?status='); // all tours
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
      imageUrl: tour.images?.[0] || ''
    });
    setModalOpen(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tour?')) return;
    try {
      const res = await api.delete(`/tours/${id}`);
      if (res.data.success) {
        setMessage('Tour deleted successfully.');
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
      images: formData.imageUrl ? [formData.imageUrl] : []
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Manage Tour Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, update, remove tours, vehicle assignments, and available seat counts
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

      {/* Tours Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Tour Title & Destination</th>
                <th className="py-3.5 px-4">Dates & Start Point</th>
                <th className="py-3.5 px-4">Vehicle Type</th>
                <th className="py-3.5 px-4">Available / Total Seats</th>
                <th className="py-3.5 px-4">Fee / Seat</th>
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
              ) : tours.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No tours found. Click "Add New Tour" above to add one.
                  </td>
                </tr>
              ) : (
                tours.map((tour) => (
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
                      <div className="text-[11px] text-slate-400">Start: {tour.startLocation}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-sky-50 text-sky-800 rounded-lg font-semibold inline-flex items-center gap-1 border border-sky-100">
                        <Bus className="w-3 h-3 text-sky-600" />
                        {tour.vehicleType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        <span className={tour.availableSeats <= 3 ? 'text-amber-600' : 'text-emerald-700'}>
                          {tour.availableSeats}
                        </span>{' '}
                        / {tour.totalSeats} seats
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-black text-slate-900 text-sm">
                        ₹{tour.pricePerPerson.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(tour)}
                        title="Edit Tour"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tour._id)}
                        title="Delete Tour"
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 my-8 overflow-hidden">
            <div className="bg-amber-500 px-6 py-4 text-slate-950 flex items-center justify-between font-black">
              <h3>{editingTour ? 'Edit Tour Details' : 'Add New Tour'}</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-amber-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
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
                  placeholder="e.g. Manali Snow Expedition"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                    placeholder="e.g. Manali, Himachal Pradesh"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                    placeholder="e.g. Delhi ISBT Terminal"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Coming Back Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Vehicle Type & Seats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Vehicle Type *
                  </label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                    Total Seats *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.totalSeats}
                    onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                    placeholder="Defaults to Total"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tour Fee Per Person (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={formData.pricePerPerson}
                  onChange={(e) => setFormData({ ...formData, pricePerPerson: e.target.value })}
                  placeholder="e.g. 7500"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
    </div>
  );
};
