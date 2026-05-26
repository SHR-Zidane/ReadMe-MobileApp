import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { store } from "./store";
import AppNavigator from "./navigation/AppNavigator";

// ─── Client React Query ───────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 2 tentatives avant de passer en état d'erreur
      retry: 2,
      // 5 minutes : évite des refetch inutiles entre les navigations
      staleTime: 5 * 60 * 1000,
    },
  },
});

// ─── Racine de l'application ──────────────────────────────────────────────────

const App = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
