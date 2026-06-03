import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets, type Edge } from "react-native-safe-area-context";

import { cn } from "@shared/lib/utils";

export interface ScreenContainerProps extends ViewProps {
  /**
   * SafeArea edges to apply. Defaults to ["top", "left", "right"].
   * Bottom is typically handled by Tab Bar.
   */
  edges?: Edge[];
  /**
   * Tailwind className for the content area.
   */
  className?: string;
  /**
   * Additional className for the outer container (background layer).
   */
  containerClassName?: string;
  /**
   * Additional className for the SafeAreaView (content layer).
   */
  safeAreaClassName?: string;
}

/**
 * A container component that properly handles SafeArea and background colors.
 *
 * The outer View extends to full screen (including status bar area) with the background color,
 * while the inner View ensures content is within safe bounds.
 *
 * Usage:
 * ```tsx
 * <ScreenContainer className="p-4">
 *   <Text className="text-2xl font-bold text-foreground">
 *     Welcome
 *   </Text>
 * </ScreenContainer>
 * ```
 */
export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  className,
  containerClassName,
  safeAreaClassName,
  style,
  ...props
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  const getEdgeStyle = (edge: Edge) => {
    switch (edge) {
      case "top": return { paddingTop: insets.top };
      case "bottom": return { paddingBottom: insets.bottom };
      case "left": return { paddingLeft: insets.left };
      case "right": return { paddingRight: insets.right };
      default: return {};
    }
  };

  const edgeStyle = edges.reduce((acc, edge) => ({ ...acc, ...getEdgeStyle(edge) }), {});

  return (
    <View
      className={cn(
        "flex-1",
        "bg-background",
        containerClassName
      )}
      {...props}
    >
      <View
        className={cn("flex-1", safeAreaClassName)}
        style={[style, edgeStyle]}
      >
        <View className={cn("flex-1", className)}>{children}</View>
      </View>
    </View>
  );
}
