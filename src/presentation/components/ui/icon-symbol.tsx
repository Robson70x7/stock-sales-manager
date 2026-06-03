import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

const MAPPING = {
  // Navigation
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  // App tabs
  "chart.bar.fill": "bar-chart",
  "cart.fill": "shopping-cart",
  "person.2.fill": "people",
  "tag.fill": "label",
  "doc.text.fill": "description",
  // Actions
  "plus": "add",
  "pencil": "edit",
  "trash": "delete",
  "magnifyingglass": "search",
  "xmark": "close",
  "checkmark": "check",
  "arrow.left": "arrow-back",
  "arrow.right": "arrow-forward",
  "ellipsis": "more-horiz",
  "square.and.arrow.up": "share",
  // Status
  "clock.fill": "access-time",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "exclamationmark.circle.fill": "error",
  // Finance
  "banknote": "payments",
  "creditcard.fill": "credit-card",
  "arrow.up.right": "trending-up",
  "arrow.down.right": "trending-down",
  // Other
  "person.fill": "person",
  "cube.box.fill": "inventory",
  "calendar": "calendar-today",
  "filter": "filter-list",
  "star.fill": "star",
  "bell.fill": "notifications",
  "gear": "settings",
} as const;

export type IconSymbolName = keyof typeof MAPPING;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name] as ComponentProps<typeof MaterialIcons>["name"]}
      style={style}
    />
  );
}
