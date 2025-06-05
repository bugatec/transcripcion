
// MainActivity.java - Configuración para manejar permisos de micrófono en WebView
// Este archivo debe reemplazar el MainActivity.java generado por Capacitor

package com.lovable.transcripcion;

import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Configurar WebChromeClient para manejar permisos automáticamente
        WebView webView = (WebView) getBridge().getWebView();
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                // Conceder automáticamente permisos de micrófono a la WebView
                runOnUiThread(() -> {
                    request.grant(request.getResources());
                });
            }

            @Override
            public void onPermissionRequestCanceled(PermissionRequest request) {
                super.onPermissionRequestCanceled(request);
            }
        });

        // Habilitar JavaScript y configuraciones adicionales para audio
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        webView.getSettings().setDomStorageEnabled(true);
    }
}
