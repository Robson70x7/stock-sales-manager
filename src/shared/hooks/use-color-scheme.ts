import { useThemeContext } from "@shared/lib/theme-provider";

export function useColorScheme() {
  return useThemeContext().colorScheme;
}
