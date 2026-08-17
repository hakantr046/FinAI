# FinAI Bütünleşik Servis Başlatıcı
# ----------------------------------------
Clear-Host
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "      🚀 FinAI GELİŞTİRME ORTAMI BAŞLATICISI        " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Python AI gRPC Servisini Başlat
Write-Host "🐍 [1/3] Python AI gRPC Servisi başlatılıyor (Port: 50051)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd src/ai_service; .\venv\Scripts\activate; python server.py" -WindowStyle Minimized

# 2. .NET Backend API (dotnet watch ile Hot-Reload aktif) Başlat
Write-Host "⚡ [2/3] .NET Backend API başlatılıyor (Port: 5115 - Hot Reload aktif)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/FinAI.Backend; dotnet watch run" -WindowStyle Normal

# 3. Next.js Frontend Başlat
Write-Host "🌐 [3/3] Next.js Frontend başlatılıyor (Port: 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host "  ✅ Tüm servisler başlatıldı!" -ForegroundColor Green
Write-Host "  - Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "  - Backend (API): http://localhost:5115" -ForegroundColor Green
Write-Host "  - .NET Hot-Reload aktiftir. Kod değiştirdiğinizde sunucu otomatik güncellenir." -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
