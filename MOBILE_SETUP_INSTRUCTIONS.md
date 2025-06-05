
# Configuración para Micrófono en Dispositivos Móviles

## Problema
El micrófono puede no funcionar correctamente en dispositivos móviles debido a restricciones de permisos de WebView y requisitos de HTTPS para getUserMedia.

## Soluciones Implementadas

### 1. Configuración de HTTPS en Capacitor
El archivo `capacitor.config.ts` ya está configurado con:
- `iosScheme: 'https'`
- `androidScheme: 'https'`

Esto fuerza el uso de HTTPS, que es requerido para getUserMedia.

### 2. MainActivity.java Personalizada
Cuando exportes el proyecto a tu repositorio local:

1. Navega a `android/app/src/main/java/com/lovable/transcripcion/`
2. Reemplaza el contenido de `MainActivity.java` con el código del archivo `android-mainactivity-config.java`
3. Esto permite que la WebView conceda permisos automáticamente

### 3. Permisos en AndroidManifest.xml
Los permisos ya están configurados en `android-manifest-config.json`. Capacitor los aplicará automáticamente.

## Pasos para Implementar en Proyecto Local

1. **Exportar proyecto a GitHub**
2. **Clonar localmente**
3. **Instalar dependencias**: `npm install`
4. **Agregar plataformas**: `npx cap add android` y/o `npx cap add ios`
5. **Actualizar MainActivity.java** con el código proporcionado
6. **Sincronizar**: `npx cap sync`
7. **Compilar**: `npm run build`
8. **Ejecutar**: `npx cap run android` o `npx cap run ios`

## Verificación
Después de implementar estos cambios, el micrófono debería funcionar correctamente en dispositivos físicos y emuladores.

## Troubleshooting Adicional
- Asegúrate de que el dispositivo tenga micrófono físico
- Verifica que los permisos estén concedidos en Configuración > Apps > Tu App > Permisos
- Para dispositivos USB-C, conecta antes de abrir la aplicación
