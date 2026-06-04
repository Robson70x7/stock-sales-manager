import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { usePermissions } from "@shared/hooks/use-permissions";
import { PERMISSIONS } from "@shared/auth/permissions";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { can } = usePermissions();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Resumo",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
          ...(can(PERMISSIONS.DASHBOARD_VIEW) ? {} : { href: null }),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Vendas",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="cart.fill" color={color} />,
          ...(can(PERMISSIONS.SALES_VIEW) ? {} : { href: null }),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Produtos",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="cube.box.fill" color={color} />,
          ...(can(PERMISSIONS.PRODUCTS_VIEW) ? {} : { href: null }),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: "Clientes",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.2.fill" color={color} />,
          ...(can(PERMISSIONS.CLIENTS_VIEW) ? {} : { href: null }),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Relatórios",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.bar.fill" color={color} />,
          ...(can(PERMISSIONS.REPORTS_VIEW) ? {} : { href: null }),
        }}
      />
      <Tabs.Screen
        name="tags"
        options={{
          title: "Tags",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="tag.fill" color={color} />,
          ...(can(PERMISSIONS.TAGS_VIEW) ? {} : { href: null }),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Configurações",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="gear" color={color} />,
          ...(can(PERMISSIONS.SETTINGS_MANAGE) ? {} : { href: null }),
        }}
      />
    </Tabs>
  );
}
