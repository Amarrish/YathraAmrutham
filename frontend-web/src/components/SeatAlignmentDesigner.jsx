import React, { useState, useEffect } from 'react';
import { LayoutGrid, Armchair, Ban, Check, RefreshCw, Wand2 } from 'lucide-react';

/**
 * SeatAlignmentDesigner - Interactive visual matrix designer for vehicle seating
 * 
 * Props:
 *  - initialGrid: { rows: number, columns: number, cells: Array<{ row, col, isSeat, seatNumber, isBlockedByAdmin }> }
 *  - onChange: (gridData: { rows, columns, cells, totalSeats }) => void
 */
export const SeatAlignmentDesigner = ({ initialGrid, onChange }) => {
  const [rows, setRows] = useState(initialGrid?.rows || 10);
  const [columns, setColumns] = useState(initialGrid?.columns || 5);
  // cellMap: { "r-c": { row, col, isSeat, seatNumber, isBlockedByAdmin } }
  const [cellMap, setCellMap] = useState({});

  // Initialize or re-populate cellMap whenever rows or columns change
  useEffect(() => {
    const newMap = {};
    const existingCells = initialGrid?.cells || [];
    const lookup = {};
    existingCells.forEach((c) => {
      lookup[`${c.row}-${c.col}`] = c;
    });

    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= columns; c++) {
        const key = `${r}-${c}`;
        if (lookup[key]) {
          newMap[key] = {
            row: r,
            col: c,
            isSeat: lookup[key].isSeat !== false,
            isBlockedByAdmin: Boolean(lookup[key].isBlockedByAdmin)
          };
        } else {
          // Default layout: if 5 cols, col 3 is aisle (except last row)
          // if 7 cols, cols 3,4,5 are aisle (except last row)
          let isSeat = true;
          if (r < rows) {
            if (columns === 5 && c === 3) isSeat = false;
            if (columns === 6 && (c === 3 || c === 4)) isSeat = false;
            if (columns === 7 && (c === 3 || c === 4 || c === 5)) isSeat = false;
            if (columns === 4 && (c === 2 || c === 3)) isSeat = false;
          }
          newMap[key] = {
            row: r,
            col: c,
            isSeat,
            isBlockedByAdmin: false
          };
        }
      }
    }

    recalculateSeats(newMap, rows, columns);
  }, [rows, columns]);

  // Renumber seats sequentially 1..N across all active seat cells
  const recalculateSeats = (map, rCount, cCount) => {
    let seatCounter = 1;
    const cellsArray = [];
    const updatedMap = { ...map };

    for (let r = 1; r <= rCount; r++) {
      for (let c = 1; c <= cCount; c++) {
        const key = `${r}-${c}`;
        const cell = updatedMap[key] || { row: r, col: c, isSeat: true, isBlockedByAdmin: false };
        if (cell.isSeat) {
          cell.seatNumber = seatCounter++;
        } else {
          cell.seatNumber = null;
        }
        updatedMap[key] = cell;
        cellsArray.push(cell);
      }
    }

    setCellMap(updatedMap);
    const totalSeats = seatCounter - 1;

    if (onChange) {
      onChange({
        rows: rCount,
        columns: cCount,
        cells: cellsArray,
        totalSeats
      });
    }
  };

  // Toggle individual cell between Seat and Aisle/Empty
  const toggleCell = (r, c) => {
    const key = `${r}-${c}`;
    const current = cellMap[key] || { row: r, col: c, isSeat: true };
    const updatedMap = {
      ...cellMap,
      [key]: {
        ...current,
        isSeat: !current.isSeat
      }
    };
    recalculateSeats(updatedMap, rows, columns);
  };

  // Preset 1: Standard 2+2 with full back row (e.g. 5 columns, col 3 aisle for rows 1 to N-1)
  const apply2Plus2 = () => {
    setColumns(5);
    const newMap = {};
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= 5; c++) {
        const key = `${r}-${c}`;
        const isSeat = r === rows ? true : c !== 3; // full row on last
        newMap[key] = { row: r, col: c, isSeat, isBlockedByAdmin: false };
      }
    }
    recalculateSeats(newMap, rows, 5);
  };

  // Preset 2: 2+1 Innova/SUV layout (e.g. 4 columns, col 3 aisle, full back row)
  const apply2Plus1 = () => {
    setColumns(4);
    const newMap = {};
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= 4; c++) {
        const key = `${r}-${c}`;
        const isSeat = r === rows ? true : c !== 3;
        newMap[key] = { row: r, col: c, isSeat, isBlockedByAdmin: false };
      }
    }
    recalculateSeats(newMap, rows, 4);
  };

  // Preset 3: Wide Bus 10x7 with middle cols 3, 4, 5 as aisle in rows 1 to N-1, and 7 seats in back row
  const applyWideBus10x7 = () => {
    setRows(10);
    setColumns(7);
    const newMap = {};
    for (let r = 1; r <= 10; r++) {
      for (let c = 1; c <= 7; c++) {
        const key = `${r}-${c}`;
        // Rows 1-9: columns 3, 4, 5 are disabled aisle. Row 10: full 7 seats!
        const isSeat = r === 10 ? true : !(c === 3 || c === 4 || c === 5);
        newMap[key] = { row: r, col: c, isSeat, isBlockedByAdmin: false };
      }
    }
    recalculateSeats(newMap, 10, 7);
  };

  // Helper: toggle an entire column as aisle for rows 1 to N-1
  const toggleColumnAisle = (targetCol) => {
    const updatedMap = { ...cellMap };
    // Check if column is currently mostly aisle
    let aisleCount = 0;
    for (let r = 1; r < rows; r++) {
      if (!updatedMap[`${r}-${targetCol}`]?.isSeat) aisleCount++;
    }
    const makeSeats = aisleCount >= Math.floor((rows - 1) / 2);

    for (let r = 1; r < rows; r++) {
      const key = `${r}-${targetCol}`;
      updatedMap[key] = {
        row: r,
        col: targetCol,
        isSeat: makeSeats,
        isBlockedByAdmin: false
      };
    }
    recalculateSeats(updatedMap, rows, columns);
  };

  // Helper: enable all seats in last row
  const enableFullLastRow = () => {
    const updatedMap = { ...cellMap };
    for (let c = 1; c <= columns; c++) {
      const key = `${rows}-${c}`;
      updatedMap[key] = {
        row: rows,
        col: c,
        isSeat: true,
        isBlockedByAdmin: false
      };
    }
    recalculateSeats(updatedMap, rows, columns);
  };

  const totalSeatsCount = Object.values(cellMap).filter((c) => c.isSeat).length;

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-amber-600" />
            Vehicle Seat Alignment Grid Designer
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Design vehicle layout (e.g. 10 Rows × 7 Columns with aisle & full 6–7 back row). Click any cell to toggle Seat / Aisle.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs font-bold">
          <span className="text-slate-500">Calculated Capacity:</span>
          <span className="text-emerald-600 text-sm font-black">{totalSeatsCount} Seats</span>
        </div>
      </div>

      {/* Dimension Inputs & Quick Presets */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Total Rows</label>
            <input
              type="number"
              min="2"
              max="25"
              value={rows}
              onChange={(e) => setRows(Math.max(2, Math.min(25, Number(e.target.value) || 2)))}
              className="w-20 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Total Columns</label>
            <input
              type="number"
              min="3"
              max="9"
              value={columns}
              onChange={(e) => setColumns(Math.max(3, Math.min(9, Number(e.target.value) || 3)))}
              className="w-20 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 mr-1">Quick Presets:</span>
          <button
            type="button"
            onClick={applyWideBus10x7}
            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-bold text-[11px] border border-amber-300 transition-colors flex items-center gap-1"
          >
            <Wand2 className="w-3 h-3" />
            10×7 Bus (Full 7 Back Row)
          </button>
          <button
            type="button"
            onClick={apply2Plus2}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-[11px] border border-slate-200 transition-colors"
          >
            Standard 2+2 Bus
          </button>
          <button
            type="button"
            onClick={apply2Plus1}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-[11px] border border-slate-200 transition-colors"
          >
            2+1 Innova/SUV
          </button>
          <button
            type="button"
            onClick={enableFullLastRow}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px] border border-emerald-200 transition-colors"
            title="Make all cells in the last row seats"
          >
            Fill Last Row ({columns} Seats)
          </button>
        </div>
      </div>

      {/* Visual Alignment Matrix */}
      <div className="overflow-x-auto p-4 bg-white rounded-xl border border-slate-200 flex flex-col items-center">
        {/* Front of vehicle indicator */}
        <div className="w-full max-w-md flex items-center justify-between px-4 py-1.5 bg-slate-100 rounded-lg border border-slate-200 mb-3 text-[11px] font-bold text-slate-600">
          <span>🚌 Driver / Entry</span>
          <span>FRONT OF VEHICLE</span>
          <span>Steering ✇</span>
        </div>

        {/* Quick Column Header Aisle Toggles */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] text-slate-400 w-7 text-right">Col:</span>
          {Array.from({ length: columns }, (_, cIdx) => (
            <button
              key={cIdx}
              type="button"
              onClick={() => toggleColumnAisle(cIdx + 1)}
              title={`Click to toggle Column ${cIdx + 1} as aisle for rows 1 to ${rows - 1}`}
              className="w-8 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 rounded text-[9px] font-bold border border-slate-200"
            >
              C{cIdx + 1}
            </button>
          ))}
        </div>

        {/* Grid rows */}
        <div className="space-y-1.5">
          {Array.from({ length: rows }, (_, rIdx) => {
            const r = rIdx + 1;
            const isLastRow = r === rows;

            return (
              <div key={r} className="flex items-center gap-1.5">
                <span className={`text-[10px] w-7 text-right font-mono ${isLastRow ? 'font-black text-amber-600' : 'text-slate-400'}`}>
                  R{r}
                </span>

                {Array.from({ length: columns }, (_, cIdx) => {
                  const c = cIdx + 1;
                  const key = `${r}-${c}`;
                  const cell = cellMap[key] || { isSeat: true };

                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCell(r, c)}
                      title={`Row ${r}, Col ${c}: ${cell.isSeat ? `Seat #${cell.seatNumber} (Click to make aisle)` : 'Aisle/Empty (Click to make seat)'}`}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] transition-all select-none border ${
                        cell.isSeat
                          ? isLastRow
                            ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-2xs hover:bg-amber-200'
                            : 'bg-emerald-100 border-emerald-400 text-emerald-800 shadow-2xs hover:bg-emerald-200'
                          : 'bg-slate-100 border-dashed border-slate-300 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {cell.isSeat ? (
                        cell.seatNumber
                      ) : (
                        <span className="text-[8px] text-slate-400">aisle</span>
                      )}
                    </button>
                  );
                })}

                {isLastRow && (
                  <span className="text-[10px] font-bold text-amber-700 ml-2 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 whitespace-nowrap">
                    Back Row ({columns} Seats)
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-400" />
            <span className="text-slate-600">Standard Seat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-400" />
            <span className="text-slate-600">Back Row Seat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-slate-100 border border-dashed border-slate-300" />
            <span className="text-slate-600">Aisle / Walkway (Empty)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
