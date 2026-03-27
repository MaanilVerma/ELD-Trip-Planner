// Shared motion transition presets
// Spring with no bounce: snappy, not bouncy (Emil + Jakub style)

export const fadeUp = {
  initial: { opacity: 0, y: 6, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -4, filter: "blur(3px)" },
  transition: { type: "spring" as const, duration: 0.3, bounce: 0 },
};

export const fadeDown = {
  initial: { opacity: 0, y: -8, filter: "blur(3px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -6, filter: "blur(2px)" },
  transition: { type: "spring" as const, duration: 0.25, bounce: 0 },
};

export const fadeScale = {
  initial: { opacity: 0, scale: 0.97, filter: "blur(4px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.98, filter: "blur(2px)" },
  transition: { type: "spring" as const, duration: 0.3, bounce: 0 },
};
