import React from 'react';

/**
 * SeatMap - Visual interactive seat picker
 * Props:
 *   totalSeats       : number
 *   bookedSeats      : number[]   — already taken
 *   selectedSeats    : number[]   — user's current selection
 *   onSeatClick      : (n) => void
 *   maxSelectable    : number
 *   vehicleType      : string     — drives layout (2+2 vs 2+1)
 *   adminMode        : boolean    — shows passenger dots & name tooltips
 *   seatData         : { [n]: { isOccupied, passenger } }
 *   highlightedSeat  : number     — yellow ring in admin reassign flow
 *   onAdminSeatClick : (n, info) => void
 *   readOnly         : boolean
 */
export const SeatMap = ({
  totalSeats = 40,
  bookedSeats = [],
  selectedSeats = [],
  onSeatClick,
  maxSelectable = 1,
  vehicleType = '',
  adminMode = false,
  seatData = {},
  highlightedSeat = null,
  onAdminSeatClick,
  readOnly = false
}) => {
  const getLayout = () => {
    const vt = (vehicleType || '').toLowerCase();
    if (
      vt.includes('innova') ||
      vt.includes('suv') ||
      vt.includes('van') ||
      vt.includes('urbania')
    ) {
      return { left: 2, right: 1 };
    }
    return { left: 2, right: 2 };
  };

  const layout = getLayout();
  const seatsPerRow = layout.left + layout.right;
  const rows = Math.ceil(totalSeats / seatsPerRow);

  const getSeatStatus = (seatNum) => {
    if (seatNum > totalSeats) return 'ghost';
    if (selectedSeats.includes(seatNum)) return 'selected';
    if (adminMode && seatData[seatNum]?.isOccupied) return 'booked';
    if (bookedSeats.includes(seatNum)) return 'booked';
    return 'available';
  };

  const getSeatClasses = (status, seatNum) => {
    const base =
      'relative w-9 h-9 flex items-center justify-center text-[10px] font-bold transition-all duration-150 select-none border-2 rounded-t-xl';
    const bottom = 'rounded-bl rounded-br';

    if (highlightedSeat === seatNum)
      return `${base} ${bottom} bg-yellow-300 border-yellow-500 text-yellow-900 ring-2 ring-yellow-400 scale-110`;

    switch (status) {
      case 'selected':
        return `${base} ${bottom} bg-blue-500 border-blue-700 text-white cursor-pointer hover:bg-blue-600`;
      case 'booked':
        return `${base} ${bottom} bg-slate-300 border-slate-400 text-slate-500 cursor-not-allowed`;
      case 'available':
        return `${base} ${bottom} bg-emerald-100 border-emerald-400 text-emerald-800 cursor-pointer hover:bg-emerald-200 hover:scale-105`;
      case 'ghost':
        return 'w-9 h-9';
      default:
        return `${base} ${bottom} bg-slate-100 border-slate-200 text-slate-400`;
    }
  };

  const handleClick = (seatNum) => {
    if (readOnly) return;
    const status = getSeatStatus(seatNum);
    if (status === 'ghost') return;

    if (adminMode && onAdminSeatClick) {
      onAdminSeatClick(seatNum, seatData[seatNum] || { isOccupied: false, passenger: null });
      return;
    }

    if (!onSeatClick) return;
    if (status === 'booked') return;

    if (status === 'selected') {
      onSeatClick(seatNum); // deselect
      return;
    }
    if (selectedSeats.length >= maxSelectable) {
      alert(`You can only select ${maxSelectable} seat(s). Please deselect one first.`);
      return;
    }
    onSeatClick(seatNum);
  };

  const renderSeat = (seatNum) => {
    const status = getSeatStatus(seatNum);
    const cls = getSeatClasses(status, seatNum);
    const passenger = adminMode ? seatData[seatNum]?.passenger : null;

    if (status === 'ghost') return <div key={`g-${seatNum}`} className="w-9 h-9" />;

    let title = `Seat #${seatNum} — ${status}`;
    if (adminMode && passenger) {
      title = `${passenger.name} | Age: ${passenger.age} | ${passenger.gender} | ${passenger.paymentStatus}`;
    }

    return (
      <div
        key={seatNum}
        onClick={() => handleClick(seatNum)}
        title={title}
        className={cls}
      >
        {seatNum}
        {adminMode && passenger && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sky-500 rounded-full border border-white" />
        )}
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex flex-col items-center gap-3 min-w-[260px] max-w-[400px] mx-auto">
        {/* Driver row */}
        <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500 font-semibold">🚌 Driver</span>
          <span className="text-slate-400 font-medium">
            {layout.left === 2 && layout.right === 2 ? '2+2 layout' : '2+1 layout'}
          </span>
          <span className="text-slate-500 font-semibold">Front →</span>
        </div>

        {/* Rows */}
        <div className="w-full space-y-2">
          {Array.from({ length: rows }, (_, rowIdx) => {
            const base = rowIdx * seatsPerRow + 1;
            const leftSeats = Array.from({ length: layout.left }, (_, i) => base + i);
            const rightSeats = Array.from({ length: layout.right }, (_, i) => base + layout.left + i);

            return (
              <div key={rowIdx} className="flex items-center gap-2 justify-center">
                <span className="text-[10px] text-slate-400 w-5 text-right font-medium">{rowIdx + 1}</span>
                <div className="flex gap-1.5">{leftSeats.map(renderSeat)}</div>
                <div className="w-5 flex items-center justify-center">
                  <div className="w-px h-7 bg-slate-200" />
                </div>
                <div className="flex gap-1.5">{rightSeats.map(renderSeat)}</div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 pt-2 flex-wrap justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-100 border-2 border-emerald-400" />
            <span className="text-[11px] text-slate-600">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-blue-500 border-2 border-blue-700" />
            <span className="text-[11px] text-slate-600">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-slate-300 border-2 border-slate-400" />
            <span className="text-[11px] text-slate-600">Booked</span>
          </div>
          {adminMode && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-yellow-300 border-2 border-yellow-500" />
              <span className="text-[11px] text-slate-600">Highlighted</span>
            </div>
          )}
        </div>

        {selectedSeats.length > 0 && !adminMode && (
          <div className="w-full p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 font-semibold text-center">
            Selected: {[...selectedSeats].sort((a, b) => a - b).map((n) => `#${n}`).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};
