/**
 * Centralised font-family constants.
 * Fonts are loaded once in app/_layout.tsx via useFonts.
 * Use these keys in StyleSheet fontFamily properties.
 */
export const F = {
  /** Poppins ExtraBold — punchy headings, big stat numbers */
  heading: "Poppins_800ExtraBold",
  /** Poppins Bold — screen titles, section headers */
  title: "Poppins_700Bold",
  /** Inter SemiBold — labels, buttons, tab text, card names */
  semi: "Inter_600SemiBold",
  /** Inter Regular — body copy, descriptions, sub-labels */
  body: "Inter_400Regular",
} as const;
