import React from 'react';

/**
 * SeatMap - Visual interactive seat picker supporting custom row x col seating grids
 * 
 * Props:
 *   totalSeats       : number
 *   bookedSeats      : number[] | Array<{ seatNumber }>   — already taken
 *   blockedSeats     : number[]                           — admin blocked/disabled seats
 *   selectedSeats    : number[]                           — user's current selection
 *   onSeatClick      : (n) => void
 *   maxSelectable    : number
 *   vehicleType      : string                             — fallback heuristic (2+2 vs 2+1)
 *   seatingGrid      : { rows, columns, cells }           — custom grid designer model
 *   adminMode        : boolean                            — shows passenger dots & name tooltips
 *   seatData         : { [n]: { isOccupied, passenger, isBlockedByAdmin } }
 *   highlightedSeat  : number                             — yellow ring in admin reassign flow
 *   onAdminSeatClick : (n, info) => void
 *   readOnly         : boolean
 */
export const SeatMap = ({
  totalSeats = 40,
  bookedSeats = [],
  blockedSeats = [],
  selectedSeats = [],
  onSeatClick,
  maxSelectable = 1,
  vehicleType = '',
  seatingGrid = null,
  adminMode = false,
  seatData = {},
  highlightedSeat = null,
  onAdminSeatClick,
  readOnly = false
}) => {
  // Normalize bookedSeats to array of numbers
  const bookedNumbers = (bookedSeats || []).map((b) =>
    typeof b === 'object' && b !== null && b.seatNumber ? b.seatNumber : Number(b)
  );

  const blockedNumbers = (blockedSeats || []).map((b) => Number(b));

  // Determine status of a seat
  const getSeatStatus = (seatNum) => {
    if (!seatNum || seatNum > totalSeats) return 'ghost';
    if (highlightedSeat === seatNum) return 'highlighted';
    if (selectedSeats.includes(seatNum)) return 'selected';
    if (adminMode && seatData[seatNum]?.isOccupied) return 'booked';
    if (bookedNumbers.includes(seatNum)) return 'booked';
    if (blockedNumbers.includes(seatNum) || seatData[seatNum]?.isBlockedByAdmin) return 'blocked';
    return 'available';
  };

  const getSeatClasses = (status, seatNum) => {
    const base =
      'relative w-9 h-9 flex items-center justify-center text-[10px] font-bold transition-all duration-150 select-none border-2 rounded-t-xl rounded-bl rounded-br';

    if (highlightedSeat === seatNum) {
      return `${base} bg-yellow-300 border-yellow-500 text-yellow-900 ring-2 ring-yellow-400 scale-110`;
    }

    switch (status) {
      case 'selected':
        return `${base} bg-blue-500 border-blue-700 text-white cursor-pointer hover:bg-blue-600 scale-105`;
      case 'booked':
        return `${base} bg-slate-300 border-slate-400 text-slate-500 cursor-not-allowed`;
      case 'blocked':
        return adminMode
          ? `${base} bg-rose-100 border-rose-300 text-rose-700 cursor-pointer hover:bg-rose-200`
          : `${base} bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed`;
      case 'available':
        return `${base} bg-emerald-100 border-emerald-400 text-emerald-800 cursor-pointer hover:bg-emerald-200 hover:scale-105`;
      case 'ghost':
        return 'w-9 h-9';
      default:
        return `${base} bg-slate-100 border-slate-200 text-slate-400`;
    }
  };

  const handleClick = (seatNum, cellInfo = null) => {
    if (readOnly) return;
    const status = getSeatStatus(seatNum);
    if (status === 'ghost') return;

    if (adminMode && onAdminSeatClick) {
      onAdminSeatClick(seatNum, seatData[seatNum] || {
        isOccupied: status === 'booked',
        isBlockedByAdmin: status === 'blocked',
        passenger: seatData[seatNum]?.passenger || null,
        cellInfo
      });
      return;
    }

    if (!onSeatClick) return;
    if (status === 'booked' || status === 'blocked') return;

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

  const renderSeatElement = (seatNum, cellInfo = null) => {
    const status = getSeatStatus(seatNum);
    const cls = getSeatClasses(status, seatNum);
    const passenger = adminMode ? seatData[seatNum]?.passenger : null;

    if (status === 'ghost') return <div key={`g-${seatNum}`} className="w-9 h-9" />;

    let title = `Seat #${seatNum} — ${status}`;
    if (status === 'blocked') {
      title = adminMode
        ? `Seat #${seatNum} is Blocked/Disabled by Admin. Click to unblock.`
        : `Seat #${seatNum} is Reserved/Disabled`;
    } else if (adminMode && passenger) {
      title = `${passenger.name} | Age: ${passenger.age} | ${passenger.gender} | ${passenger.paymentStatus}`;
    }

    return (
      <div
        key={`seat-${seatNum}`}
        onClick={() => handleClick(seatNum, cellInfo)}
        title={title}
        className={cls}
      >
        {seatNum}
        {adminMode && passenger && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sky-500 rounded-full border border-white" />
        )}
        {status === 'blocked' && (
          <span className="absolute -bottom-1 -right-1 text-[8px] bg-rose-600 text-white rounded-full px-1">
            ✕
          </span>
        )}
      </div>
    );
  };

  // Has custom grid with cells?
  const hasCustomGrid =
    seatingGrid &&
    Array.isArray(seatingGrid.cells) &&
    seatingGrid.cells.length > 0;

  // Fallback layout helper
  const getFallbackLayout = () => {
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

  const layout = getFallbackLayout();
  const seatsPerRow = layout.left + layout.right;
  const fallbackRows = Math.ceil(totalSeats / seatsPerRow);

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="flex flex-col items-center gap-3 min-w-[280px] max-w-[500px] mx-auto">
        {/* Driver row */}
        <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500 font-semibold">🚌 Driver / Entry</span>
          <span className="text-slate-400 font-medium">
            {hasCustomGrid
              ? `${seatingGrid.rows} Rows × ${seatingGrid.columns} Columns Alignment`
              : layout.left === 2 && layout.right === 2
              ? 'Standard 2+2 layout'
              : '2+1 SUV layout'}
          </span>
          <span className="text-slate-500 font-semibold">Front →</span>
        </div>

        {/* ── Custom Seating Grid View (Row x Column) ───────────── */}
        {hasCustomGrid ? (
          <div className="w-full space-y-2">
            {Array.from({ length: seatingGrid.rows }, (_, rIdx) => {
              const r = rIdx + 1;
              const isLastRow = r === seatingGrid.rows;
              // Cells in this row
              const rowCells = [];
              for (let c = 1; c <= seatingGrid.columns; c++) {
                const cell = seatingGrid.cells.find((x) => x.row === r && x.col === c) || {
                  row: r,
                  col: c,
                  isSeat: true
                };
                rowCells.push(cell);
              }

              return (
                <div key={r} className="flex items-center gap-1.5 justify-center">
                  <span
                    className={`text-[10px] w-5 text-right font-mono ${
                      isLastRow ? 'font-black text-amber-600' : 'text-slate-400'
                    }`}
                  >
                    {r}
                  </span>

                  <div className="flex gap-1.5">
                    {rowCells.map((cell) => {
                      if (!cell.isSeat) {
                        return (
                          <div
                            key={`aisle-${r}-${cell.col}`}
                            className="w-9 h-9 flex items-center justify-center text-[9px] text-slate-300 font-medium select-none"
                            title="Aisle / Walkway"
                          >
                            <span className="text-[10px] text-slate-200">•</span>
                          </div>
                        );
                      }
                      return renderSeatElement(cell.seatNumber, cell);
                    })}
                  </div>

                  {isLastRow && (
                    <span className="hidden sm:inline-block text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 whitespace-nowrap">
                      Back Row
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Fallback Heuristic Layout (2+2 or 2+1) ─────────────── */
          <div className="w-full space-y-2">
            {Array.from({ length: fallbackRows }, (_, rowIdx) => {
              const base = rowIdx * seatsPerRow + 1;
              const leftSeats = Array.from({ length: layout.left }, (_, i) => base + i);
              const rightSeats = Array.from(
                { length: layout.right },
                (_, i) => base + layout.left + i
              );

              return (
                <div key={rowIdx} className="flex items-center gap-2 justify-center">
                  <span className="text-[10px] text-slate-400 w-5 text-right font-medium">
                    {rowIdx + 1}
                  </span>
                  <div className="flex gap-1.5">{leftSeats.map((n) => renderSeatElement(n))}</div>
                  <div className="w-5 flex items-center justify-center">
                    <div className="w-px h-7 bg-slate-200" />
                  </div>
                  <div className="flex gap-1.5">{rightSeats.map((n) => renderSeatElement(n))}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-3 pt-2 flex-wrap justify-center text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-emerald-100 border-2 border-emerald-400" />
            <span className="text-slate-600">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-blue-500 border-2 border-blue-700" />
            <span className="text-slate-600">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-slate-300 border-2 border-slate-400" />
            <span className="text-slate-600">Booked (Disabled)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-rose-100 border-2 border-rose-300 text-rose-700 text-[8px] flex items-center justify-center font-bold">
              ✕
            </div>
            <span className="text-slate-600">Admin Blocked</span>
          </div>
          {adminMode && (
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-yellow-300 border-2 border-yellow-500" />
              <span className="text-slate-600">Target Swap</span>
            </div>
          )}
        </div>

        {selectedSeats.length > 0 && !adminMode && (
          <div className="w-full p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 font-semibold text-center">
            Selected Seats: {[...selectedSeats].sort((a, b) => a - b).map((n) => `#${n}`).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};
