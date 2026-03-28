/**
 * Central motion tokens for shared micro-interactions.
 * Keep these values small so hover/focus remain subtle and accessible.
 */
export const cardMotion = {
  hover: {
    scale: 1.03,
    y: -6,
    boxShadow: '0 22px 60px -28px rgba(15, 23, 42, 0.55)',
  },
  focus: {
    scale: 1.02,
    y: -4,
    boxShadow: '0 18px 48px -26px rgba(15, 23, 42, 0.5)',
  },
  active: {
    boxShadow: '0 24px 70px -30px rgba(59, 130, 246, 0.45)',
  },
  transition: {
    type: 'spring' as const,
    stiffness: 260,
    damping: 26,
    mass: 0.9,
  },
};

export const reducedCardMotion = {
  hover: { scale: 1, y: 0 },
  focus: { scale: 1, y: 0 },
  transition: { duration: 0.12 },
};
