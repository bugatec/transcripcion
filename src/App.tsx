import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

import { Permissions } from '@capacitor/permissions';
import { App } from '@capacitor/app';

async function requestMicrophonePermission() {
  const status = await Permissions.request({ name: 'microphone' });

  if (status.state === 'denied') {
    const confirmed = confirm('Necesitas permitir el acceso al micrófono desde la configuración de tu teléfono. ¿Quieres abrir la configuración ahora?');
    
    if (confirmed) {
      App.openSettings();
    }
  }
}

export default App;
