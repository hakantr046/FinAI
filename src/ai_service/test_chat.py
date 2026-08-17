import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

try:
    print("Testing with correct dict history...")
    history_items = [
        {"role": "user", "parts": [{"text": "Merhaba"}]},
        {"role": "model", "parts": [{"text": "Merhaba! Nasıl yardımcı olabilirim?"}]}
    ]
    chat = client.chats.create(
        model="gemini-flash-latest",
        config={
            "system_instruction": "Test system instruction"
        },
        history=history_items
    )
    print("Sending message...")
    response = chat.send_message("Bana 3 öneri ver")
    print("Response:", response.text)
except Exception as e:
    import traceback
    traceback.print_exc()
