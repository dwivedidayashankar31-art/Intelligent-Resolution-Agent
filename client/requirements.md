## Packages
framer-motion | Essential for smooth, futuristic micro-interactions and waveform animations
recharts | Beautiful data visualization for the CRM Admin dashboard
date-fns | Formatting timestamps in the CRM tables
clsx | Classname utility
tailwind-merge | Classname utility for dynamic styling

## Notes
- Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  body: ["var(--font-body)"],
  mono: ["var(--font-mono)"],
}
- Voice streaming hooks are expected at `@/replit_integrations/audio` (Assuming `@` is mapped to `client/`). If not mapped, ensure relative paths resolve to `client/replit_integrations/audio`.
- Dark mode is forced natively via CSS variables for a premium, futuristic AI aesthetic.
