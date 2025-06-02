import { useEffect } from "react";
import { Permissions } from "@capacitor/permissions";
import { App as CapacitorApp } from "@capacitor/app";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const requestMicrophonePermission = async () => {
      try {
        const status = await Permissions.request({ name: "microphone" });

        if (status.state === "denied") {
          const openSettings = confirm(
            "Necesitas permitir el acceso al micrófono desde la configuración de tu teléfono. ¿Quieres abrir la configuración ahora?"
          );
          if (openSettings) {
            await CapacitorApp.openSettings();
          }
        }
      } catch (error) {
        console.error("Error al pedir el permiso de micrófono:", error);
      }
    };

    requestMicrophonePermission();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
