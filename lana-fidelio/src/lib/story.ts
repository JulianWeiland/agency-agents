/**
 * LANA — The Fidelio Secret · every copy string, in one place.
 * Chapters import from here; never hard-code copy in components.
 * Strings follow docs/SPEC.md exactly (typographic apostrophes ’ and ellipsis … are intentional).
 */

export type KingdomId = "sea" | "balance";

export interface KingdomCopy {
  id: KingdomId;
  /** KINGDOM OF THE SEA */
  title: string;
  /** Saadiyat Island, Abu Dhabi */
  place: string;
  /** "Kingdom of the Sea" — title-case form for running text / the decree */
  name: string;
  tagline: string;
  highlights: readonly [string, string, string];
}

export const story = {
  meta: {
    title: "LANA — The Fidelio Secret",
    tagline: "Some secrets are written in the stars. Others are unlocked at midnight.",
    her: "Lana",
    him: "Julian",
    password: "FIDELIO",
  },

  portal: {
    label: "THE MIDNIGHT INVITATION",
    title: "Princess Lana.",
    subtitle: "You have been expected.",
    small: "Some doors only open once the clock strikes twelve.",
    ritual:
      "Your midnight ritual has three ingredients: something sweet, something mysterious, and one secret only you can unlock.",
    date: "15 · 11 · 2026",
    cta: "Enter the Ritual",
  },

  fidelio: {
    lines: ["Every secret has a key.", "Every invitation has a password.", "What is the password?"],
    small: "The evening has already offered its first indulgence. The real secret is still waiting.",
    inputLabel: "The password",
    inputPlaceholder: "· · · · · · ·",
    submit: "Speak the Word",
    /** rotate through these on a wrong answer */
    wrong: [
      "The stars are not quite aligned.",
      "Mercury retrograde, perhaps?",
      "Even rookies deserve another attempt.",
    ],
    /** shown from the 4th wrong answer on (after 3+ wrong) */
    wrongMany: "Mercury is clearly responsible for this.",
    hintCta: "Ask the stars for a hint",
    hints: [
      "A word of loyalty, hidden in a famous midnight mystery.",
      "Seven letters. It begins with F.",
      "F I D E L I O",
    ],
    revealCta: "Reveal the password",
    success: ["Welcome, Princess Lana.", "The stars have been waiting."],
  },

  cosmic: {
    lines: [
      "Born under the sign of Scorpio.",
      "A little mysterious. Beautifully intuitive. Impossible to predict.",
      "Tonight, the stars have aligned around two very special dates.",
      "One marks the beginning of your story.",
      "The other marks the beginning of ours.",
    ],
    russian: "Звёзды уже всё решили…",
    strategy: "But even destiny requires a little strategy.",
    rookie: "Ready, Rookie?",
    cta: "Reveal My Challenge",
    sign: "Scorpio",
  },

  sudoku: {
    header: "One final challenge before destiny reveals your reward.",
    sub: "Even queens have to think a few moves ahead.",
    toastBox: "Beautifully played.",
    toastMistakes: "Careful, Rookie. This isn’t chess.",
    tools: {
      notes: "Notes",
      erase: "Erase",
      undo: "Undo",
      hint: "Hint",
    },
    revealCta: "Reveal remaining solution",
    revealSheet: {
      title: "Reveal the remaining solution?",
      body: "The stars will finish the board for you. Your reward stays exactly the same.",
      confirm: "Yes, reveal it",
      cancel: "Let me keep playing",
    },
    complete: "Checkmate, Princess.",
  },

  dates: {
    first: { date: "15.11.2002", caption: "The day a princess was born." },
    second: { date: "11.11.2026", caption: "The day our story began." },
    lines: ["Some things are written in the stars.", "Others begin with one very special person."],
    birthday: "Happy Birthday, Lana.",
    russian: "С днём рождения, моя принцесса.",
    cta: "Open Your Gift",
    tapHint: "Tap to continue",
  },

  gift: {
    before: "One last thing, Princess.",
    hint: "Tap the ribbon",
    headline: "One wish. Two hearts. A little escape.",
    reveal: "A Romantic Staycation — Just You & Me.",
    lines: [
      "You’ve been wishing for a little getaway together.",
      "So I thought it was time we made that wish come true.",
      "No schedules. No responsibilities. Just a beautiful little escape with you.",
    ],
    footer: "With love, Julian ♡",
    cta: "Choose Your Kingdom",
  },

  kingdoms: {
    heading: "Choose Your Kingdom",
    sea: {
      id: "sea",
      title: "KINGDOM OF THE SEA",
      name: "Kingdom of the Sea",
      place: "Saadiyat Island, Abu Dhabi",
      tagline: "Where the sea is turquoise, the days are slow, and the only plan is enjoying each other.",
      highlights: ["Barefoot mornings on white sand", "Turquoise water, unhurried days", "Sunset walks, just us"],
    } as KingdomCopy,
    balance: {
      id: "balance",
      title: "KINGDOM OF BALANCE",
      name: "Kingdom of Balance",
      place: "SIRO One Za’abeel, Dubai",
      tagline: "Where the city stays beneath us and the world can wait while we recharge together.",
      highlights: ["The skyline at our feet", "Rituals of rest and recovery", "Slow mornings above the city"],
    } as KingdomCopy,
    order: ["sea", "balance"] as readonly KingdomId[],
    exploreCta: "Explore This Kingdom",
    chooseCta: "Choose This Kingdom",
    back: "Back to both kingdoms",
    imageCaption: "Illustrative impression",
    confirm: {
      title: "Is this your chosen kingdom, Princess?",
      yes: "Yes, this one ♡",
      no: "Let me dream a little longer",
    },
  },

  decree: {
    title: "A ROYAL BIRTHDAY INVITATION",
    fields: {
      presentedTo: { label: "Presented to", value: "Princess Lana" },
      occasion: { label: "Occasion", value: "Her 24th Birthday" },
      gift: { label: "Gift", value: "A Romantic Staycation for Two" },
      destination: { label: "Chosen destination" },
      dates: { label: "Dates", value: "To Be Chosen Together" },
      from: { label: "From", value: "Julian ♡" },
    },
    line: "Your wish has been received, Your Highness. I’ll take care of the rest.",
    forecast: "Royal forecast: romance, relaxation… and possibly no chicken.",
    easterEgg: "Rookie status: upgraded to Princess.",
    easterEggLabel: "A royal secret",
    saveCta: "Save as Image",
    shareCta: "Share with Julian",
    continueCta: "Continue",
    /** only show when the POST to /api/choice really succeeded (state.choiceSynced) */
    copied: "Copied — ready to send to Julian ♡",
    fileName: "royal-decree-princess-lana.png",
    shareTitle: "A Royal Decree",
    /** text for Web Share / clipboard; pass the chosen kingdom */
    shareText: (k: KingdomCopy) =>
      `Julian — by royal decree, I choose the ${k.name} · ${k.place}. Dates: to be chosen together. — Princess Lana ♡`,
  },

  finale: {
    lines: ["Some nights are written in the stars.", "This one is ours."],
    birthday: "Happy Birthday, моя принцесса ♡",
    small: "May your next adventure be as sweet as tonight.",
    revisitCta: "Revisit My Gift",
    reliveCta: "Relive the Story",
    sudokuAgain: "Play the Sudoku again",
    easterEgg: "Chicken: optional. Kisses: highly recommended.",
  },

  common: {
    soundOn: "Sound on",
    soundOff: "Sound off",
    skip: "Tap to continue",
    close: "Close",
  },
} as const;

export type Story = typeof story;

/** Convenience lookup: kingdomCopy('sea') */
export function kingdomCopy(id: KingdomId): KingdomCopy {
  return story.kingdoms[id];
}
