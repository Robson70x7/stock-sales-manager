import "../../../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import "@shared/_core/nativewind-pressable";
import { ThemeProvider } from "@shared/lib/theme-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@shared/lib/query-client";
import { AppProvider } from "@shared/context/AppContext";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";
import { SQLiteProvider } from "expo-sqlite";
import { migrateDbIfNeeded } from "@infra/database/db";
import { initManusRuntime, subscribeSafeAreaInsets } from "@shared/_core/manus-runtime";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  // Configuração padrão do header (tema escuro - hardcoded)
  const headerOptions = {
    headerStyle: { backgroundColor: '#0F172A' }, // slate-950 (bg-background)
    headerTintColor: '#F8FAFC', // slate-50 (text-foreground)
    headerTitleStyle: { color: '#F8FAFC' },
    headerShadowVisible: false,
    headerShown: true,
  };

  const content = (
    <AppProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="sales/new" options={{ title: "Nova Venda", presentation: "fullScreenModal", ...headerOptions }} />
              <Stack.Screen name="sales/[id]" options={{ title: "Detalhes da Venda", ...headerOptions }} />
              <Stack.Screen name="sales/edit/[id]" options={{ title: "Editar Venda", presentation: "fullScreenModal", ...headerOptions }} />
              <Stack.Screen name="products/[id]" options={{ title: "Detalhes do Produto", ...headerOptions }} />
              <Stack.Screen name="clients/[id]" options={{ title: "Detalhes do Cliente", ...headerOptions }} />
              <Stack.Screen name="tags/index" options={{ title: "Tags", ...headerOptions }} />
              <Stack.Screen name="tags/[id]" options={{ title: "Detalhes da Tag", ...headerOptions }} />
            </Stack>
        </QueryClientProvider>
        <StatusBar style="light" />
      </GestureHandlerRootView>
    </AppProvider>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              <SQLiteProvider databaseName="stock_sales.db" onInit={migrateDbIfNeeded}>
                {content}
              </SQLiteProvider>
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>
        <SQLiteProvider databaseName="stock_sales.db" onInit={migrateDbIfNeeded}>
          {content}
        </SQLiteProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
