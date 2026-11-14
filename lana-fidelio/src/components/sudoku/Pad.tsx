"use client";

export interface PadProps {
  /** remaining[d] = how many of digit d are still missing (index 0 unused) */
  remaining: readonly number[];
  notesMode: boolean;
  /** pencil marks of the selected cell (bitmask), used to light the keys in notes mode */
  selectedNotes: number;
  disabled?: boolean;
  onDigit(digit: number): void;
}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/** 3×3 number pad with a remaining-count on each key; a digit retires once all nine are placed. */
export function Pad({ remaining, notesMode, selectedNotes, disabled = false, onDigit }: PadProps) {
  return (
    <div className="sdk-pad" role="group" aria-label="Number pad">
      {DIGITS.map((d) => {
        const left = remaining[d] ?? 0;
        const done = left === 0;
        const noted = notesMode && (selectedNotes & (1 << d)) !== 0;
        return (
          <button
            key={d}
            type="button"
            className="sdk-key"
            disabled={disabled || done}
            data-done={done ? "" : undefined}
            data-pencil={notesMode && !noted ? "" : undefined}
            data-noted={noted ? "" : undefined}
            aria-label={done ? `${d}, complete` : `${d}, ${left} remaining${notesMode ? ", note" : ""}`}
            aria-pressed={notesMode ? noted : undefined}
            onClick={() => onDigit(d)}
          >
            <span className="sdk-key-digit">{d}</span>
            {!done && (
              <span className="sdk-left" aria-hidden>
                {left}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Pad;
