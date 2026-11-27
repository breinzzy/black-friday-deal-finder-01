// The honest signal: is this really a deal?
// Every deal carries one of five verdicts, set by the agent when the price was
// checked. The scale is the same for every deal, so a NEW LOW always means the
// same thing and a ROUTINE always means the same thing. The `rank` orders
// verdicts from best to worst for the "Best deal first" sort tie-break.

export const VERDICTS = {
  "NEW LOW": {
    label: "NEW LOW",
    rank: 0,
    blurb: "Lowest price ever — confirmed by at least two sources.",
  },
  STRONG: {
    label: "STRONG",
    rank: 1,
    blurb: "A deep cut (40% or more) on a current model.",
  },
  GOOD: {
    label: "GOOD",
    rank: 2,
    blurb: "A solid cut (25–40%) — worth buying if you want it.",
  },
  MODEST: {
    label: "MODEST",
    rank: 3,
    blurb: "A small cut, or a good price once a gift card or bundle is counted.",
  },
  ROUTINE: {
    label: "ROUTINE",
    rank: 4,
    blurb: "A small cut on a product that rarely drops further — buy only if you need it now.",
  },
};

export function verdictInfo(verdict) {
  return VERDICTS[verdict] ?? VERDICTS.ROUTINE;
}

// CSS class for a verdict badge, e.g. "verdict-new-low".
export function verdictClass(verdict) {
  return `verdict-${verdict.toLowerCase().replace(/ /g, "-")}`;
}
