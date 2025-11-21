# UI Kit (shared primitives)

- **Purpose:** Platform-neutral-ish primitives for web now, with React Native Web compatibility in mind. Avoid direct DOM APIs; use props compatible with RN-Web (e.g., `onPress` via `PressableCard`).
- **Tokens:** All colors/spacing/typography must come from design tokens (Tailwind theme variables set via org/domain). Do not hardcode hex values.
- **Components:** Buttons, Cards, Tabs, Inputs, PressableCard, Skeleton, Badges, Select, etc. If you add one, keep it dependency-light and accessible (focus ring, aria labels where needed).
- **Story/demo:** See `/ui-demo` route for quick manual verification; prefer adding a story co-located with the component when Storybook/Chromatic is enabled.
- **RN/Web guidance:**
  - Avoid `window/document` usage inside components; lift that to callers.
  - Prefer flexbox/layout classes without absolute pixel assumptions; ensure min tap target 44px.
  - For touch + keyboard, keep `role="button"` and `tabIndex={0}` when using div-like pressables; mirror `onPress` to `onClick` for web.
