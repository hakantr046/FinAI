# FinAI

Kişisel finans yönetimi platformu: .NET 9 backend, Next.js 15 frontend, Python gRPC AI servisi ve React Native mobil uygulama.

## Proje Yapısı

- `backend/FinAI.Backend` — .NET 9 Minimal API
- `frontend` — Next.js 15 web arayüzü
- `mobile` — Expo / React Native mobil uygulama
- `src/ai_service` — Python gRPC AI servisi (Gemini)

## Gereksinimler

- [Docker](https://www.docker.com/) + Docker Compose (en kolay yöntem)
- Alternatif olarak yerel kurulum için: .NET 9 SDK, Node.js 20+, Python 3.11+

## Hızlı Başlangıç (Docker ile)

1. Repoyu klonla:
   ```
   git clone https://github.com/hakantr046/FinAI.git
   cd FinAI
   ```
2. Gerekli `.env` dosyalarını örneklerden oluştur:
   ```
   cp .env.example .env
   cp src/ai_service/.env.example src/ai_service/.env
   cp frontend/.env.example frontend/.env.local
   cp backend/FinAI.Backend/appsettings.Development.json.example backend/FinAI.Backend/appsettings.Development.json
   ```
3. Yukarıda oluşturduğun dosyalardaki değerleri kendi bilgilerinle doldur:
   - `.env` (root, `docker compose` tarafından kullanılır) → `JWT_KEY` (rastgele uzun bir string), `EMAIL_SENDER` / `EMAIL_SENDER_PASSWORD` (Gmail kullanıyorsan bir [Uygulama Şifresi](https://myaccount.google.com/apppasswords) oluştur), `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `src/ai_service/.env` → `GEMINI_API_KEY` ([Google AI Studio](https://aistudio.google.com/apikey) üzerinden alınabilir)
   - `backend/FinAI.Backend/appsettings.Development.json` ve `frontend/.env.local` → yerel (Docker'sız) geliştirme yapacaksan aynı değerleri buraya da gir
4. Servisleri ayağa kaldır:
   ```
   docker compose up --build
   ```
5. Uygulamalara eriş:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5115
   - AI servisi (gRPC): localhost:50051

## Yerel (Docker'sız) Geliştirme

**Backend:**
```
cd backend/FinAI.Backend
dotnet restore
dotnet run
```

**Frontend:**
```
cd frontend
npm install
npm run dev
```

**AI servisi:**
```
cd src/ai_service
pip install -r requirements.txt
python server.py
```

**Mobil (Expo):**
```
cd mobile
npm install
npx expo start
```

## Güvenlik Notu

`.env`, `.env.local` ve `appsettings.Development.json` dosyaları `.gitignore` ile hariç tutulmuştur ve gerçek gizli anahtarlar içermelidir — bunları asla commit etmeyin.
