export const animations = {
  fadeIn: "animate-in fade-in duration-500",
  slideUp: "animate-in fade-in slide-in-from-bottom-4 duration-500",
  slideDown: "animate-in fade-in slide-in-from-top-4 duration-500",
  stagger: (index: number) => ({
    animationDelay: `${index * 100}ms`
  }),
  hoverScale: "transition-transform hover:scale-105 duration-200",
  glassHover: "hover:bg-white/50 hover:shadow-lg transition-all duration-300",
  pulse: "animate-pulse"
};

export const transitions = {
  default: "transition-all duration-300 ease-in-out",
  fast: "transition-all duration-150 ease-out",
  slow: "transition-all duration-700 ease-in-out"
};
