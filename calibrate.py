import sys

raw = """Actúa como director de video con IA. Crea un video promocional de 60s en 1080p para la app Quinela Master Pro v1.3.1 siguiendo este guion:

[ESCENA 1 - GANCHO & APERTURA | 0:00 - 0:08]
Visual: Plano de un jugador mirando con duda un ticket de quiniela. Abre su teléfono e inicia Quinela Master Pro. Transición dinámica con brillo dorado y logo en modo oscuro.
Texto: ¿Querés saber si tu boleto ganó? | Análisis con Inteligencia Artificial.
Locución: "¿Jugaste a la quiniela y no sabés si ganaste o qué número elegir para hoy? Descubrí Quinela Master Pro, la suite inteligente para los apostadores de Argentina."

[ESCENA 2 - ESCÁNER CON CÁMARA & COMPROBANTE | 0:08 - 0:22]
Visual: Teléfono enfocando con láser verde el código de barras del boleto. Salta en pantalla: ¡BOLETO GANADOR! Liquidación oficial $140.000 ARS. Se despliega el ticket térmico digital con botones de imprimir y compartir.
Texto: 📸 Foto y Escáner en Vivo | ⚡ Cotejo Oficial | 🧾 Comprobante Digital.
Locución: "Tomale una foto a tu boleto o ingresá tu secuencia. La app coteja tus jugadas en segundos contra extractos oficiales de Ciudad y Provincia, liquidando tu premio exacto para cobrarlo en tu agencia."

[ESCENA 3 - PRONÓSTICOS PREDICTIVOS CON IA | 0:22 - 0:36]
Visual: Tarjetas con porcentaje de probabilidad. Ambos recomendados, ternos (500x) y cuaternos (3.500x) acompañados de mapas de calor y semáforos de atraso estadístico.
Texto: 🧠 Modelos Estadísticos Reales | 🎯 Ambos, Ternos y Cuaternos.
Locución: "Dejá el azar atrás. Nuestro motor de IA analiza sorteos históricos para darte los números con mayor probabilidad matemática a la cabeza, ternos y cuaternos."

[ESCENA 4 - RESULTADOS EN VIVO & HERRAMIENTAS | 0:36 - 0:48]
Visual: Pizarra con los 5 turnos diarios (La Previa a Nocturna) y tablero de 20 premios. Búsqueda táctil en el Libro de los Sueños (del 00 al 99) y calculadora de bankroll.
Texto: 🏆 5 Turnos en Vivo | 🌙 Libro de los Sueños | 📈 20 Premios.
Locución: "Seguí los 5 turnos del día en vivo, consultá el Libro de los Sueños y protegé tu dinero con la calculadora de estrategia inteligente."

[ESCENA 5 - CIERRE & LLAMADO A LA ACCIÓN | 0:48 - 1:00]
Visual: Smartphone 3D flotando con sellos de 15 Días VIP Gratis. Botón de descarga en Google Play Store y logotipo final de Ingeniería JH.
Texto: 🎁 15 Días VIP Gratis | 📲 Descargala en Google Play Store | ⭐ Quinela Master Pro.
Locución: "Jugá informado con datos reales. Descargá Quinela Master Pro hoy en Google Play y activá tus 15 días VIP gratis."
"""

raw = raw.strip()
diff = 2500 - len(raw)
print(f"Diff: {diff}, Length: {len(raw)}")
if diff == 1:
    raw = raw.replace("hoy en Google Play", "hoy en Google Play ")
print(f"Final length: {len(raw)}")
with open("texto_ai_2500_exacto.txt", "w", encoding="utf-8") as f:
    f.write(raw)
