/**
 * Scoped styles for the Sudoku (class prefix `sdk-`). Injected once by SudokuChapter via <style>,
 * so nothing here leaks into the shared stylesheet.
 */
export const SUDOKU_CSS = /* css */ `
.sdk-root {
  height: 100dvh;
  min-height: 540px;
  padding-left: max(12px, env(safe-area-inset-left));
  padding-right: max(12px, env(safe-area-inset-right));
  padding-top: max(14px, env(safe-area-inset-top));
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  gap: clamp(8px, 1.7dvh, 20px);
  align-items: center;
  justify-content: center;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.sdk-header {
  flex: none;
  width: 100%;
  padding: 0 56px;
  text-align: center;
}
.sdk-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(0.98rem, 4.5vw, 1.2rem);
  line-height: 1.14;
  color: #850c30;
  text-wrap: balance;
}
@media (min-height: 760px) {
  .sdk-title { font-size: clamp(1.05rem, 5vw, 1.375rem); }
}
.sdk-sub {
  margin-top: 0.3rem;
  font-family: var(--font-display);
  font-style: italic;
  font-size: clamp(0.84rem, 3.7vw, 0.98rem);
  line-height: 1.2;
  color: #7a4353;
}

/* ── board ─────────────────────────────────────────────── */
.sdk-fit {
  container-type: size;
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  max-height: calc(min(100vw, 480px) - 24px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.sdk-frame {
  position: relative;
  width: min(100cqw, 100cqh);
  height: min(100cqw, 100cqh);
  flex: none;
}
.sdk-board {
  container-type: inline-size;
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  grid-template-rows: repeat(9, minmax(0, 1fr));
  background: #fffaf3;
  border-radius: 13px;
  overflow: hidden;
  box-shadow:
    0 0 0 1.5px #d7b47b,
    0 0 0 4.5px rgba(255, 250, 243, 0.85),
    0 0 0 5.5px rgba(215, 180, 123, 0.55),
    0 24px 44px -24px rgba(133, 12, 48, 0.45);
}
.sdk-cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 0;
  padding: 0;
  margin: 0;
  border: 0;
  border-right: 1px solid rgba(201, 141, 147, 0.3);
  border-bottom: 1px solid rgba(201, 141, 147, 0.3);
  background: transparent;
  font-family: var(--font-display);
  font-variant-numeric: lining-nums;
  font-size: 7.4cqw;
  line-height: 1;
  font-weight: 700;
  color: #4a1526;
  cursor: pointer;
  outline: none;
  transition: background-color 0.18s ease, color 0.18s ease;
}
.sdk-cell[data-c="2"], .sdk-cell[data-c="5"] { border-right: 1.5px solid #d7b47b; }
.sdk-cell[data-r="2"], .sdk-cell[data-r="5"] { border-bottom: 1.5px solid #d7b47b; }
.sdk-cell[data-c="8"] { border-right: 0; }
.sdk-cell[data-r="8"] { border-bottom: 0; }
.sdk-cell > .sdk-digit { position: relative; z-index: 1; transform: translateY(-0.04em); }

.sdk-cell[data-kind="player"] { color: #b3265a; font-weight: 600; }
.sdk-cell[data-kind="hint"] { color: #a47e45; font-weight: 600; font-style: italic; }

.sdk-cell[data-peer] { background: #fdecef; }
.sdk-cell[data-same] { background: #f7c6d0; }
.sdk-cell[data-conflict] { background: #fbd9d2; }
.sdk-cell[data-wrong] { color: #c62f1c; background: #fbd9d2; }
.sdk-cell[data-wrong]::after {
  content: "";
  position: absolute;
  top: 9%;
  right: 9%;
  width: 13%;
  height: 13%;
  border-radius: 50%;
  background: #c62f1c;
}
.sdk-cell[data-wrong] > .sdk-digit {
  text-decoration: underline wavy #c62f1c;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.12em;
}
.sdk-cell[data-sel] {
  background: #850c30;
  color: #fff8f0;
  box-shadow: inset 0 0 0 1.5px #d7b47b, inset 0 0 14px rgba(255, 200, 210, 0.25);
}
.sdk-cell[data-sel][data-kind="player"] { color: #ffe3e9; }
.sdk-cell[data-sel][data-kind="hint"] { color: #f0dcb4; }
.sdk-cell[data-sel][data-wrong] { color: #ffb9a8; background: #850c30; }
.sdk-cell[data-sel][data-wrong]::after { background: #ffb9a8; }
.sdk-cell[data-sel][data-wrong] > .sdk-digit { text-decoration-color: #ffb9a8; }
.sdk-cell:focus-visible { box-shadow: inset 0 0 0 2px #a47e45; }
.sdk-cell[data-sel]:focus-visible { box-shadow: inset 0 0 0 2px #f0dcb4; }

.sdk-notes {
  position: absolute;
  inset: 7%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  font-family: var(--font-ui);
  font-size: 2.75cqw;
  font-weight: 600;
  line-height: 1;
  color: #8a5263;
  font-style: normal;
}
.sdk-notes > span { display: flex; align-items: center; justify-content: center; }
.sdk-cell[data-sel] .sdk-notes { color: #f4b7c3; }
.sdk-notes > span[data-hit] { color: #850c30; font-weight: 800; }
.sdk-cell[data-sel] .sdk-notes > span[data-hit] { color: #fff8f0; }

/* hint lands */
@keyframes sdk-hint {
  0% { box-shadow: inset 0 0 0 0 rgba(240, 215, 160, 0), 0 0 0 0 rgba(215, 180, 123, 0); }
  35% { box-shadow: inset 0 0 0 3px rgba(240, 215, 160, 1), 0 0 16px 4px rgba(215, 180, 123, 0.85); }
  100% { box-shadow: inset 0 0 0 1.5px #d7b47b, 0 0 0 0 rgba(215, 180, 123, 0); }
}
@keyframes sdk-hint-digit {
  0% { opacity: 0; transform: translateY(-0.04em) scale(0.6); }
  55% { opacity: 1; transform: translateY(-0.04em) scale(1.18); }
  100% { opacity: 1; transform: translateY(-0.04em) scale(1); }
}
.sdk-cell[data-flash] { animation: sdk-hint 1.1s ease-out both; z-index: 1; }
.sdk-cell[data-flash] > .sdk-digit { animation: sdk-hint-digit 0.55s cubic-bezier(0.22, 0.61, 0.36, 1) both; }

/* cascade fill (bypass / reveal) */
@keyframes sdk-pop {
  0% { opacity: 0; transform: translateY(18%) scale(0.7); }
  60% { opacity: 1; transform: translateY(-4%) scale(1.06); }
  100% { opacity: 1; transform: translateY(-0.04em) scale(1); }
}
.sdk-cell[data-cascade] > .sdk-digit {
  animation: sdk-pop 0.36s cubic-bezier(0.22, 0.61, 0.36, 1) both;
  animation-delay: calc(var(--d) * 56ms);
}

/* completion: a golden pulse travels diagonally across the board */
@keyframes sdk-pulse {
  0% { background-color: #fffaf3; }
  35% { background-color: #f3d9a4; box-shadow: inset 0 0 12px rgba(255, 244, 214, 0.95); }
  100% { background-color: #fdf3e1; box-shadow: inset 0 0 0 rgba(255, 244, 214, 0); }
}
@keyframes sdk-pulse-digit {
  0% { transform: translateY(-0.04em) scale(1); }
  35% { transform: translateY(-0.04em) scale(1.16); color: #850c30; }
  100% { transform: translateY(-0.04em) scale(1); color: #8a6430; }
}
.sdk-board[data-phase="pulse"] .sdk-cell {
  animation: sdk-pulse 0.75s ease-out both;
  animation-delay: calc(var(--d) * 58ms);
  color: #4a1526;
}
.sdk-board[data-phase="pulse"] .sdk-cell > .sdk-digit {
  animation: sdk-pulse-digit 0.75s ease-out both;
  animation-delay: calc(var(--d) * 58ms);
}
.sdk-board[data-phase="solved"] .sdk-cell { background: #fdf3e1; color: #8a6430; cursor: default; }
.sdk-board[data-phase="solved"] .sdk-cell[data-kind="given"] { color: #5d3a1d; }
.sdk-board[data-phase="pulse"] .sdk-cell, .sdk-board[data-phase="solved"] .sdk-cell { cursor: default; }

@keyframes sdk-sweep {
  0% { transform: translate3d(-130%, -130%, 0); opacity: 0; }
  12% { opacity: 1; }
  88% { opacity: 1; }
  100% { transform: translate3d(130%, 130%, 0); opacity: 0; }
}
.sdk-sweep {
  position: absolute;
  inset: 0;
  border-radius: 13px;
  overflow: hidden;
  pointer-events: none;
  z-index: 2;
}
.sdk-sweep::before {
  content: "";
  position: absolute;
  inset: -20%;
  background: linear-gradient(135deg, transparent 40%, rgba(255, 246, 220, 0.85) 50%, transparent 60%);
  mix-blend-mode: soft-light;
  animation: sdk-sweep 1.5s cubic-bezier(0.4, 0, 0.3, 1) both;
}
@keyframes sdk-halo {
  0% { box-shadow: 0 0 0 0 rgba(215, 180, 123, 0); }
  45% { box-shadow: 0 0 0 3px rgba(215, 180, 123, 0.9), 0 0 46px 6px rgba(240, 215, 160, 0.75); }
  100% { box-shadow: 0 0 0 1px rgba(215, 180, 123, 0.5), 0 0 30px 2px rgba(240, 215, 160, 0.45); }
}
.sdk-halo {
  position: absolute;
  inset: 0;
  border-radius: 13px;
  pointer-events: none;
  animation: sdk-halo 1.6s ease-out both;
}

/* ── controls ──────────────────────────────────────────── */
.sdk-controls {
  flex: none;
  width: 100%;
  max-width: calc(min(100vw, 480px) - 24px);
  display: grid;
  grid-template-columns: minmax(0, 0.74fr) minmax(0, 1fr);
  gap: clamp(8px, 2.6vw, 12px);
  --key-h: clamp(44px, 6.5dvh, 56px);
  --key-gap: 6px;
}
.sdk-tools {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: var(--key-gap);
}
.sdk-pad {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: var(--key-h);
  gap: var(--key-gap);
}
.sdk-key, .sdk-tool {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(180deg, #fffdf9 0%, #fff4ec 100%);
  color: #850c30;
  box-shadow:
    inset 0 0 0 1px rgba(215, 180, 123, 0.75),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 6px 14px -10px rgba(133, 12, 48, 0.55);
  cursor: pointer;
  outline: none;
  touch-action: manipulation;
  transition: transform 0.12s ease, background 0.18s ease, color 0.18s ease, opacity 0.25s ease, box-shadow 0.18s ease;
}
.sdk-key:active:not(:disabled), .sdk-tool:active:not(:disabled) {
  transform: scale(0.965);
  background: #fbe3e7;
}
.sdk-key:focus-visible, .sdk-tool:focus-visible { box-shadow: inset 0 0 0 2px #850c30; }
.sdk-key:disabled, .sdk-tool:disabled { cursor: default; }
.sdk-key {
  font-family: var(--font-display);
  font-variant-numeric: lining-nums;
  font-weight: 600;
  font-size: clamp(1.5rem, 3.9dvh, 1.9rem);
  line-height: 1;
}
.sdk-key > .sdk-key-digit { transform: translateY(-0.05em); }
.sdk-key > .sdk-left {
  position: absolute;
  top: 5px;
  right: 7px;
  font-family: var(--font-ui);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #a47e45;
}
.sdk-key:disabled { opacity: 0.38; box-shadow: inset 0 0 0 1px rgba(215, 180, 123, 0.45); }
.sdk-key[data-done] > .sdk-key-digit { text-decoration: line-through; text-decoration-thickness: 1px; text-decoration-color: rgba(164, 126, 69, 0.8); }
.sdk-key[data-pencil] { font-style: italic; color: #7a4353; background: linear-gradient(180deg, #fff8f0 0%, #fbe9ea 100%); }
.sdk-key[data-noted] { color: #fff8f0; background: linear-gradient(180deg, #a01a44, #850c30); box-shadow: inset 0 0 0 1px #d7b47b; }
.sdk-key[data-noted] > .sdk-left { color: #f0dcb4; }

.sdk-tool {
  flex-direction: column;
  gap: 4px;
  min-height: 44px;
}
.sdk-tool > .sdk-tool-label {
  font-family: var(--font-ui);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  margin-right: -0.2em;
  text-transform: uppercase;
  line-height: 1;
}
.sdk-tool:disabled { opacity: 0.4; }
.sdk-tool[aria-pressed="true"] {
  color: #fff8f0;
  background: linear-gradient(180deg, #a01a44 0%, #850c30 100%);
  box-shadow: inset 0 0 0 1px #d7b47b, inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 8px 16px -10px rgba(133, 12, 48, 0.9);
}
.sdk-badge {
  position: absolute;
  top: 5px;
  right: 6px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-ui);
  font-size: 0.5938rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1;
  background: #d7b47b;
  color: #4a1526;
}
.sdk-tool[aria-pressed="true"] > .sdk-badge { background: #fff8f0; color: #850c30; }

.sdk-foot {
  flex: none;
  width: 100%;
  height: 40px;
  margin-top: -2px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sdk-reveal {
  min-height: 44px;
  padding: 0 14px;
  border: 0;
  background: transparent;
  color: #850c30;
  font-family: var(--font-ui);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 9px;
}
.sdk-reveal > span { border-bottom: 1px solid rgba(164, 126, 69, 0.8); padding-bottom: 3px; }
.sdk-reveal:focus-visible { outline: 2px solid #850c30; outline-offset: -4px; border-radius: 10px; }
.sdk-complete {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 1.3rem;
  color: #850c30;
}
.sdk-link {
  min-height: 44px;
  padding: 0 16px;
  border: 0;
  background: transparent;
  color: #7a4353;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.02rem;
  text-decoration: underline;
  text-decoration-color: rgba(164, 126, 69, 0.8);
  text-underline-offset: 4px;
  cursor: pointer;
}
.sdk-tall-only { display: none; }
@media (min-height: 760px) { .sdk-tall-only { display: flex; } }
@keyframes sdk-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.sdk-rise { animation: sdk-rise 0.6s ease-out both; }
.sdk-solved {
  flex: none;
  width: 100%;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .sdk-cell, .sdk-cell > .sdk-digit, .sdk-sweep::before, .sdk-halo { animation-duration: 0.01ms !important; animation-delay: 0ms !important; }
}
`;
