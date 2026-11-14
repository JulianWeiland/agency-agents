"use client";

import { Eraser, PencilLine, Sparkles, Undo2 } from "lucide-react";
import { story } from "@/lib/story";

export interface ToolbarProps {
  notesMode: boolean;
  canUndo: boolean;
  canErase: boolean;
  hints: number;
  disabled?: boolean;
  onUndo(): void;
  onErase(): void;
  onToggleNotes(): void;
  onHint(): void;
}

const ICON = { size: 19, strokeWidth: 1.6, "aria-hidden": true } as const;

/** Undo · Erase · Notes (toggle) · Hint (with a count of hints used). */
export function Toolbar({
  notesMode,
  canUndo,
  canErase,
  hints,
  disabled = false,
  onUndo,
  onErase,
  onToggleNotes,
  onHint,
}: ToolbarProps) {
  const t = story.sudoku.tools;
  return (
    <div className="sdk-tools" role="toolbar" aria-label="Sudoku tools">
      <button type="button" className="sdk-tool" disabled={disabled || !canUndo} onClick={onUndo}>
        <Undo2 {...ICON} />
        <span className="sdk-tool-label">{t.undo}</span>
      </button>
      <button type="button" className="sdk-tool" disabled={disabled || !canErase} onClick={onErase}>
        <Eraser {...ICON} />
        <span className="sdk-tool-label">{t.erase}</span>
      </button>
      <button
        type="button"
        className="sdk-tool"
        disabled={disabled}
        aria-pressed={notesMode}
        aria-label={`${t.notes} ${notesMode ? "on" : "off"}`}
        onClick={onToggleNotes}
      >
        <PencilLine {...ICON} />
        <span className="sdk-tool-label">{t.notes}</span>
        <span className="sdk-badge" aria-hidden style={notesMode ? undefined : { background: "transparent", color: "#a47e45", boxShadow: "inset 0 0 0 1px rgba(215,180,123,.8)" }}>
          {notesMode ? "On" : "Off"}
        </span>
      </button>
      <button
        type="button"
        className="sdk-tool"
        disabled={disabled}
        aria-label={hints > 0 ? `${t.hint}, ${hints} used` : t.hint}
        onClick={onHint}
      >
        <Sparkles {...ICON} />
        <span className="sdk-tool-label">{t.hint}</span>
        {hints > 0 && (
          <span className="sdk-badge" aria-hidden>
            {hints}
          </span>
        )}
      </button>
    </div>
  );
}

export default Toolbar;
