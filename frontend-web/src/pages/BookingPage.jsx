import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AdvanceWarningModal } from '../components/AdvanceWarningModal';
import {
  Users,
  CreditCard,
  Building,
  Upload,
  AlertTriangle,
  CheckCircle,
  Bus,
  Calendar,
  Shield,
  ArrowLeft
} from 'lucide-react';

export const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Booking states
  const [numberOfSeats, setNumberOfSeats] = useState(1);
  const [members, setMembers] = useState([
    {
      name: user?.name || '',
      age: '',
      gender: 'Male',
      isChild: false,
      contact: user?.phone || '',
      address: user?.address || '',
      optionalImage: ''
    }
  ]);

  const [contactDetails, setContactDetails] = useState({
    primaryName: user?.name || '',
    primaryPhone: user?.phone || '',
    primaryEmail: user?.email || '',
    address: user?.address || ''
  });

  const [paymentMethod, setPaymentMethod] = useState('Online'); // 'Online' or 'Offline'
  const [offlineDetails, setOfflineDetails] = useState({
    referenceNumber: '',
    paymentMode: 'UPI',
    notes: ''
  });

  // Modal alert
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const res = await api.get(`/tours/${id}`);
        if (res.data.success) {
          setTour(res.data.data);
          if (res.data.data.availableSeats <= 0) {
            setError('This tour is currently sold out.');
          }
        }
      } catch (err) {
        setError('Failed to fetch tour details.');
      } finally {
        setLoading(false);
      }
    };

    fetchTour();
  }, [id]);

  // Adjust members array when seat count changes
  const handleSeatChange = (newCount) => {
    const count = Math.max(1, Math.min(newCount, tour?.availableSeats || 10));
    setNumberOfSeats(count);

    const updated = [...members];
    if (count > updated.length) {
      for (let i = updated.length; i < count; i++) {
        updated.push({
          name: '',
          age: '',
          gender: 'Male',
          isChild: false,
          contact: contactDetails.primaryPhone,
          address: contactDetails.address,
          optionalImage: ''
        });
      }
    } else if (count < updated.length) {
      updated.splice(count);
    }
    setMembers(updated);
  };

  const handleMemberChange = (index, field, value) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  // Optional image upload handler for a member
  const handleImageUpload = async (index, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        handleMemberChange(index, 'optionalImage', res.data.url);
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Failed to upload image. Please check file format.');
    }
  };

  // Calculate pricing
  const pricePerPerson = tour?.pricePerPerson || 0;
  const totalAmount = numberOfSeats * pricePerPerson;
  const advanceAmount = Math.round(totalAmount * 0.2); // 20%
  const remainingAmount = totalAmount - advanceAmount;

  // Validate form before opening modal
  const handleInitiateBooking = (e) => {
    e.preventDefault();
    setError('');

    // Validate primary contact
    if (
      !contactDetails.primaryName.trim() ||
      !contactDetails.primaryPhone.trim() ||
      !contactDetails.primaryEmail.trim() ||
      !contactDetails.address.trim()
    ) {
      setError('Please fill out all primary contact information.');
      return;
    }

    // Validate members
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.name.trim() || !m.age || isNaN(m.age) || Number(m.age) < 0) {
        setError(`Please provide valid name and age for Passenger #${i + 1}.`);
        return;
      }
    }

    if (paymentMethod === 'Offline' && !offlineDetails.referenceNumber.trim()) {
      setError('Please provide a payment reference number / transaction ID for offline payment.');
      return;
    }

    // Open mandatory non-refundable advance warning modal
    setShowWarningModal(true);
  };

  // Submit confirmed booking after agreeing in modal
  const handleConfirmAndSubmit = async () => {
    setShowWarningModal(false);
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        tourId: tour._id,
        numberOfSeats,
        members: members.map((m) => ({
          name: m.name,
          age: Number(m.age),
          gender: m.gender,
          isChild: Boolean(m.isChild),
          contact: m.contact || contactDetails.primaryPhone,
          address: m.address || contactDetails.address,
          optionalImage: m.optionalImage || ''
        })),
        contactDetails,
        paymentMethod,
        offlinePaymentDetails:
          paymentMethod === 'Offline'
            ? {
                ...offlineDetails,
                submittedAt: new Date()
              }
            : undefined,
        nonRefundableAcknowledged: true
      };

      const res = await api.post('/bookings', payload);

      if (res.data.success) {
        navigate('/dashboard', {
          state: {
            successMessage:
              paymentMethod === 'Online'
                ? `🎉 Booking Confirmed! 20% Advance of ₹${advanceAmount.toLocaleString()} received. Your seats are locked.`
                : `📋 Booking request submitted! Our admin will verify your offline payment of ₹${advanceAmount.toLocaleString()} shortly.`
          }
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error completing booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white rounded-2xl text-center">
        <p className="text-rose-600 font-bold">Tour not found.</p>
        <Link to="/" className="text-sm font-semibold text-sky-600 underline mt-2 inline-block">
          Explore Tours
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button & Title */}
      <div className="flex items-center gap-4">
        <Link
          to={`/tours/${tour._id}`}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Book Tour: {tour.title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {tour.destination} • Vehicle: {tour.vehicleType} • {tour.availableSeats} seats open
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleInitiateBooking} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Seat Selection */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              1. Number of Seats Needed
            </h3>

            <div className="flex items-center gap-4">
              <div className="w-36">
                <select
                  value={numberOfSeats}
                  onChange={(e) => handleSeatChange(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {Array.from({ length: Math.min(tour.availableSeats, 10) }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Seat' : 'Seats'}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-slate-500">
                (Maximum {Math.min(tour.availableSeats, 10)} seats per booking. Total available: {tour.availableSeats})
              </span>
            </div>
          </div>

          {/* 2. Passengers / Members Information Repeater */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" />
                2. Passenger / Member Details ({members.length})
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Please enter details for all members traveling. Child indicator and ID photos are optional.
              </p>
            </div>

            <div className="space-y-6">
              {members.map((member, index) => (
                <div
                  key={index}
                  className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
                      Passenger #{index + 1}
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={member.isChild}
                        onChange={(e) => handleMemberChange(index, 'isChild', e.target.checked)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
                      />
                      <span className="text-xs font-semibold text-slate-700">Is Child?</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={member.name}
                        onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    {/* Age */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Age *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="120"
                        placeholder="e.g. 28"
                        value={member.age}
                        onChange={(e) => handleMemberChange(index, 'age', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Gender *
                      </label>
                      <select
                        value={member.gender}
                        onChange={(e) => handleMemberChange(index, 'gender', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Contact Phone */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        placeholder="+91 98765 43210"
                        value={member.contact}
                        onChange={(e) => handleMemberChange(index, 'contact', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Residential Address
                      </label>
                      <input
                        type="text"
                        placeholder="City, State"
                        value={member.address}
                        onChange={(e) => handleMemberChange(index, 'address', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Optional Image Upload */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Optional Passenger Photo / Gov ID Image
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(index, e.target.files[0])}
                        className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                      />
                      {member.optionalImage && (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Uploaded
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Primary Booker Contact Details */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-sky-600" />
              3. Primary Contact & Billing Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Primary Name *
                </label>
                <input
                  type="text"
                  required
                  value={contactDetails.primaryName}
                  onChange={(e) =>
                    setContactDetails({ ...contactDetails, primaryName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Primary Phone *
                </label>
                <input
                  type="text"
                  required
                  value={contactDetails.primaryPhone}
                  onChange={(e) =>
                    setContactDetails({ ...contactDetails, primaryPhone: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Primary Email *
                </label>
                <input
                  type="email"
                  required
                  value={contactDetails.primaryEmail}
                  onChange={(e) =>
                    setContactDetails({ ...contactDetails, primaryEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Full Address *
                </label>
                <input
                  type="text"
                  required
                  value={contactDetails.address}
                  onChange={(e) =>
                    setContactDetails({ ...contactDetails, address: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 4. Payment Selection: Online vs Offline */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-sky-600" />
              4. Payment Method for 20% Advance
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'Online'
                    ? 'border-sky-600 bg-sky-50/50 ring-2 ring-sky-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Online"
                    checked={paymentMethod === 'Online'}
                    onChange={() => setPaymentMethod('Online')}
                    className="text-sky-600 focus:ring-sky-500 h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">Online Payment</span>
                    <span className="text-[11px] text-slate-500 block">
                      Instant seat lock via Cards / UPI / NetBanking
                    </span>
                  </div>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'Offline'
                    ? 'border-sky-600 bg-sky-50/50 ring-2 ring-sky-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Offline"
                    checked={paymentMethod === 'Offline'}
                    onChange={() => setPaymentMethod('Offline')}
                    className="text-sky-600 focus:ring-sky-500 h-4 w-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">Offline Payment</span>
                    <span className="text-[11px] text-slate-500 block">
                      Bank Transfer / UPI / Cash (Admin verified)
                    </span>
                  </div>
                </div>
              </label>
            </div>

            {/* Offline Details Input if Offline is chosen */}
            {paymentMethod === 'Offline' && (
              <div className="mt-4 p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-3">
                <span className="text-xs font-bold text-amber-950 block">
                  Offline Advance Payment Instructions:
                </span>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Transfer the 20% advance (₹{advanceAmount.toLocaleString()}) via UPI to{' '}
                  <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">
                    wanderwise@upi
                  </strong>{' '}
                  or pay cash at our office. Enter your reference number below for Admin verification.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-950 uppercase mb-1">
                      UPI Ref / UTR / Cheque No *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. UPI/HDFC/2026102199881"
                      value={offlineDetails.referenceNumber}
                      onChange={(e) =>
                        setOfflineDetails({ ...offlineDetails, referenceNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-950 uppercase mb-1">
                      Offline Mode
                    </label>
                    <select
                      value={offlineDetails.paymentMode}
                      onChange={(e) =>
                        setOfflineDetails({ ...offlineDetails, paymentMode: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="UPI">UPI Transfer</option>
                      <option value="Bank Transfer">NEFT / RTGS Bank Transfer</option>
                      <option value="Cash at Office">Cash at Office</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pricing Summary & Advance Alert */}
        <div className="space-y-6">
          <div className="sticky top-24 bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-6">
            <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-3">
              Booking Calculation
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Fee per Seat:</span>
                <span className="font-semibold text-slate-800">
                  ₹{pricePerPerson.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Number of Seats:</span>
                <span className="font-semibold text-slate-800">× {numberOfSeats}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-100">
                <span>Total Tour Price:</span>
                <span className="text-base font-black">₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Advance 20% Callout */}
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-xs space-y-2">
              <div className="flex justify-between items-center text-amber-950 font-bold text-sm">
                <span>20% Advance Payable Now:</span>
                <span className="text-lg text-emerald-700">₹{advanceAmount.toLocaleString()}</span>
              </div>
              <p className="text-amber-900 text-[11px] leading-relaxed">
                Remaining 80% (₹{remainingAmount.toLocaleString()}) to be settled before departure.
              </p>
              <div className="text-[10px] font-bold text-amber-950 bg-amber-100/80 p-2 rounded-lg border border-amber-300">
                ⚠️ NON-REFUNDABLE NOTICE: The 20% advance pre-registration fee is non-refundable upon cancellation.
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl font-bold text-sm bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Confirm & Pay 20% Advance</span>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Mandatory Non-Refundable Advance Warning Modal */}
      <AdvanceWarningModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={handleConfirmAndSubmit}
        advanceAmount={advanceAmount}
        totalAmount={totalAmount}
        seatsCount={numberOfSeats}
        tourTitle={tour.title}
      />
    </div>
  );
};
