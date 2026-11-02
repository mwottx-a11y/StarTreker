// Device detection and UI preferences that change how the game presents
// itself on touch screens.

const mm = (q) => typeof window !== 'undefined' && window.matchMedia && window.matchMedia(q).matches;

/** True on phones/tablets: a coarse primary pointer and no hover. */
export const IS_TOUCH = mm('(pointer: coarse)') || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0 && !mm('(hover: hover)'));

export const prefs = {
  // Dialogue text at 2x. Defaults on for touch devices; toggled on the title screen.
  largeText: IS_TOUCH,
};

/** Extra hit-test margin (art pixels) so small hotspots are fingertip-sized. */
export const TOUCH_PAD = IS_TOUCH ? 6 : 0;
