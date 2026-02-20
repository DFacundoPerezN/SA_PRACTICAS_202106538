import smtplib
from email.message import EmailMessage

# Datos de configuración
EMAIL_ORIGEN = "dfacundoperezn@gmail.com"
PASSWORD = "vqdguhggssmanfvu" # Sin espacios
EMAIL_DESTINO = "ddffax@gmail.com" # Puedes enviártelo a ti mismo

msg = EmailMessage()
msg.set_content("¡Hola! Si lees esto, tu configuración de Gmail funciona perfectamente.")
msg['Subject'] = "Prueba de App Password"
msg['From'] = EMAIL_ORIGEN
msg['To'] = EMAIL_DESTINO

try:
    # Conexión al servidor SMTP de Google
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login(EMAIL_ORIGEN, PASSWORD)
        smtp.send_message(msg)
    print("✅ ¡Correo enviado con éxito!")
except Exception as e:
    print(f"❌ Error: {e}")