# Guía Completa de Compilación de APK y Subida a Google Play Store

Esta guía contiene los pasos exactos para compilar el **APK de depuración**, generar el **Android App Bundle (.aab)** firmado para producción y publicarlo en **Google Play Console**.

---

## 🛠️ Estructura del Proyecto Android
El proyecto nativo de Android se encuentra listo en:
📁 `quiniela-pro-app/frontend/android`

---

## 📦 1. Compilación Rápida del APK (1 Clic)

Puedes ejecutar el archivo `build_apk.bat` incluido en esta carpeta o correr desde la terminal:

```bash
cd frontend
npm run build
npx cap sync android
cd android
gradlew.bat assembleDebug
```

El APK generado para instalar directamente en cualquier teléfono Android estará en:
📍 `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🔑 2. Generación del Keystore de Firma (Para Google Play Store)

Para subir a la Play Store, Google requiere que el paquete esté firmado digitalmente. Puedes generar tu clave de firma ejecutando en tu terminal:

```bash
keytool -genkey -v -keystore quiniela-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias quinielapro
```

> **Importante:** Guarda el archivo `quiniela-release-key.jks` y las contraseñas en un lugar seguro.

---

## 🚀 3. Compilación del Android App Bundle (.aab) para Google Play

Desde el directorio `frontend/android`:

```bash
gradlew.bat bundleRelease
```

El archivo final listo para subir a la Play Store se generará en:
📍 `frontend/android/app/build/outputs/bundle/release/app-release.aab`

---

## 📋 4. Pasos para Publicar en Google Play Console

1. **Crear la Aplicación en Play Console:**
   - Inicia sesión en [Google Play Console](https://play.google.com/console).
   - Haz clic en **"Crear aplicación"**.
   - Nombre: `Quiniela Pro - Análisis & Bankroll`
   - Idioma predeterminado: Español (América Latina).
   - Tipo de app: Aplicación (Gratis con compras/suscripción).

2. **Cargar los Gráficos de la Ficha:**
   - **Ícono de la aplicación (512x512):** Usa `play_store_package/icon_512x512.jpg`.
   - **Gráfico de funciones (1024x500):** Usa `play_store_package/feature_graphic_1024x500.jpg`.
   - **Capturas de pantalla:** Toma capturas de la app en tu teléfono o navegador en modo móvil.

3. **Cargar la Descripción y Política de Privacidad:**
   - Copia los textos de `play_store_package/STORE_LISTING.md`.
   - Pega el texto o enlace de `play_store_package/PRIVACY_POLICY.md` en la sección de Privacidad.

4. **Cuestionario de Clasificación de Contenido:**
   - Selecciona categoría: "Utilidad / Entretenimiento / Información".
   - Pregunta: *"¿La app permite juegos de azar con dinero real?"* -> Seleccionar **NO** (Es una herramienta de consulta estadística).

5. **Subir el Paquete de Producción:**
   - Ve a **Producción** -> **Crear nueva versión**.
   - Sube el archivo `app-release.aab`.
   - Haz clic en **"Revisar versión"** y luego en **"Iniciar el lanzamiento a Producción"**.
