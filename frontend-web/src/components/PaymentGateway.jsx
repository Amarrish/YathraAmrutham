import React, { useState } from 'react';
import { X, Smartphone, Building2, CreditCard, CheckCircle, Loader2 } from 'lucide-react';

export const PaymentGateway = ({ isOpen, onClose, onSuccess, amount, tourTitle }) => {
  const [activeTab, setActiveTab] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [refId, setRefId] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });

  const banks = [
    { id: 'sbi', name: 'State Bank of India', color: '#1a3a6b' },
    { id: 'hdfc', name: 'HDFC Bank', color: '#004c8f' },
    { id: 'icici', name: 'ICICI Bank', color: '#f97316' },
    { id: 'axis', name: 'Axis Bank', color: '#97144d' },
    { id: 'kotak', name: 'Kotak Mahindra', color: '#ef4444' },
    { id: 'pnb', name: 'Punjab National Bank', color: '#6d28d9' }
  ];

  const generateRef = () => 'TXN' + Date.now() + Math.floor(Math.random() * 1000);

  const simulatePayment = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 2500));
    const ref = generateRef();
    setRefId(ref);
    setProcessing(false);
    setSuccess(true);
  };

  const handleClose = () => {
    // reset state when closing
    setSuccess(false);
    setProcessing(false);
    setRefId('');
    setUpiId('');
    setSelectedBank('');
    setCard({ number: '', expiry: '', cvv: '', name: '' });
    setActiveTab('upi');
    onClose();
  };

  const fmtCard = (v) => v.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
  const fmtExp = (v) => {
    const c = v.replace(/\D/g, '');
    return c.length >= 2 ? c.slice(0, 2) + '/' + c.slice(2, 4) : c;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h3 className="font-black text-base">Secure Payment</h3>
            <p className="text-sky-200 text-xs mt-0.5 truncate max-w-[180px]">{tourTitle}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-black">₹{amount?.toLocaleString()}</div>
            <div className="text-sky-200 text-xs">20% Advance</div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-xl hover:bg-white/20 ml-3 transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Payment Successful! 🎉</h3>
            <p className="text-slate-500 text-sm">Your advance payment has been processed securely.</p>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-900">{refId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-emerald-700">₹{amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-600">✅ Confirmed</span>
              </div>
            </div>
            <button
              onClick={() => onSuccess(refId)}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg transition-all"
            >
              Continue — Confirm My Booking →
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              {[
                { id: 'upi', label: 'UPI', icon: <Smartphone className="w-4 h-4" /> },
                { id: 'netbanking', label: 'Net Banking', icon: <Building2 className="w-4 h-4" /> },
                { id: 'card', label: 'Card', icon: <CreditCard className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-sky-600 text-sky-700 bg-sky-50'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* UPI Tab */}
              {activeTab === 'upi' && (
                <form onSubmit={(e) => { e.preventDefault(); simulatePayment(); }} className="space-y-5">
                  <div className="text-center space-y-3">
                    {/* QR placeholder */}
                    <div className="w-40 h-40 mx-auto bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2">
                      <div className="grid grid-cols-5 gap-0.5">
                        {Array.from({ length: 25 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-4.5 h-4.5 rounded-sm ${[0,1,5,6,7,12,18,19,23,24].includes(i) ? 'bg-slate-800' : 'bg-white border border-slate-200'}`}
                            style={{ width: '18px', height: '18px' }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">Scan QR to Pay</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <p className="text-slate-500">Pay to UPI ID:</p>
                      <p className="font-mono font-black text-slate-900 text-sm">wanderwise@upi</p>
                      <p className="text-slate-500 mt-0.5">Amount: <strong className="text-slate-900">₹{amount?.toLocaleString()}</strong></p>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                    <div className="relative text-center"><span className="px-3 bg-white text-xs text-slate-400">or enter UPI ID</span></div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Your UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@okaxis"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:bg-slate-300"
                  >
                    {processing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                    ) : (
                      `Pay ₹${amount?.toLocaleString()} via UPI`
                    )}
                  </button>
                </form>
              )}

              {/* Net Banking Tab */}
              {activeTab === 'netbanking' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 font-medium">Select your bank to proceed securely:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {banks.map((bank) => (
                      <button
                        key={bank.id}
                        onClick={() => { setSelectedBank(bank.id); simulatePayment(); }}
                        disabled={processing}
                        className="p-4 rounded-2xl border-2 border-slate-200 hover:border-sky-400 hover:bg-sky-50 text-left transition-all disabled:opacity-50"
                      >
                        <div
                          className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center text-white text-xs font-black"
                          style={{ backgroundColor: bank.color }}
                        >
                          {bank.name.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-800">{bank.name}</span>
                      </button>
                    ))}
                  </div>
                  {processing && (
                    <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-sky-600 animate-spin flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-sky-900">
                          Connecting to {banks.find((b) => b.id === selectedBank)?.name}...
                        </p>
                        <p className="text-[11px] text-sky-700">Please wait, do not close this window.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Card Tab */}
              {activeTab === 'card' && (
                <form onSubmit={(e) => { e.preventDefault(); simulatePayment(); }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Card Number</label>
                    <input
                      type="text"
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: fmtCard(e.target.value) })}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        value={card.expiry}
                        onChange={(e) => setCard({ ...card, expiry: fmtExp(e.target.value) })}
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">CVV</label>
                      <input
                        type="password"
                        value={card.cvv}
                        onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        placeholder="•••"
                        maxLength={4}
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Name on Card</label>
                    <input
                      type="text"
                      value={card.name}
                      onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })}
                      placeholder="AS ON CARD"
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    🔒 256-bit SSL encrypted. Your card data is secure and not stored.
                  </p>
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:bg-slate-300"
                  >
                    {processing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                    ) : (
                      `Pay ₹${amount?.toLocaleString()}`
                    )}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
