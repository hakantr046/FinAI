using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.RateLimiting;
using ExcelDataReader;
using FinAI.Backend.Data;
using FinAI.Backend.Entities;
using FinAI.Backend.Services;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

// PostgreSQL DbContext Kaydı
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Servis Kayıtları
builder.Services.AddSingleton<IPiiMaskingService, PiiMaskingService>();
builder.Services.AddScoped<IAiClientService, AiClientService>();

// Rate Limiter Yapılandırması (Gemini AI Endpoint'leri İçin Limitleme)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("gemini-policy", limiterOptions =>
    {
        limiterOptions.PermitLimit = 10;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
    });
});

// JWT Authentication Yapılandırması
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization(options =>
{
    // Sadece "Admin" rolüne sahip JWT taşıyanlar admin uçlarına erişebilir
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

// CORS Politikası
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// E-Posta Servisi
builder.Services.AddSingleton<IEmailService, EmailService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowNextJs");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// ---------------------------------------------------------
// AUTH ENDPOINT 1: KAYIT OL (REGISTER)
// ---------------------------------------------------------
app.MapPost("/api/auth/register", async (RegisterDto dto, AppDbContext dbContext) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
        {
            return Results.BadRequest(new { message = "E-posta ve şifre zorunludur." });
        }

        var normalizedEmail = dto.Email.Trim().ToLower();

        var existingUser = await dbContext.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (existingUser != null)
        {
            return Results.BadRequest(new { message = "Bu e-posta adresi zaten kullanımda." });
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

        var isFirstUser = !await dbContext.Users.AnyAsync();

        var user = new User
        {
            ExternalUserId = normalizedEmail,
            Email = normalizedEmail,
            Name = string.IsNullOrWhiteSpace(dto.Name) ? normalizedEmail : dto.Name.Trim(),
            PasswordHash = passwordHash,
            IsAdmin = isFirstUser
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        return Results.Ok(new { message = "Kayıt başarılı! Giriş yapabilirsiniz." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Sistem Hatası: {ex.InnerException?.Message ?? ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// AUTH ENDPOINT 2: GİRİŞ YAP (LOGIN & JWT + REFRESH TOKEN)
// ---------------------------------------------------------
app.MapPost("/api/auth/login", async (LoginDto dto, AppDbContext dbContext, IConfiguration config) =>
{
    try
    {
        var normalizedEmail = dto.Email.Trim().ToLower();
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return Results.BadRequest(new { message = "E-posta veya şifre hatalı." });
        }

        var (accessToken, refreshToken) = GenerateTokenPair(user, config);
        dbContext.RefreshTokens.Add(refreshToken);
        await dbContext.SaveChangesAsync();

        return Results.Ok(new
        {
            accessToken,
            refreshToken = refreshToken.Token,
            token = accessToken, // Backwards compatibility for existing client state
            user = new { id = user.ExternalUserId, name = user.Name, email = user.Email, isAdmin = user.IsAdmin }
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Giriş Hatası: {ex.InnerException?.Message ?? ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// AUTH ENDPOINT 2.1: GOOGLE İLE GİRİŞ (SIGN IN WITH GOOGLE)
// ---------------------------------------------------------
app.MapPost("/api/auth/google", async (GoogleLoginDto dto, AppDbContext dbContext, IConfiguration config) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(dto.IdToken))
        {
            return Results.BadRequest(new { message = "Google kimlik jetonu (idToken) gereklidir." });
        }

        var clientIds = config.GetSection("Google:ClientIds").Get<string[]>() ?? Array.Empty<string>();
        if (clientIds.Length == 0)
        {
            return Results.BadRequest(new { message = "Google girişi backend tarafında yapılandırılmamış (Google:ClientIds)." });
        }

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = clientIds
            });
        }
        catch (InvalidJwtException)
        {
            return Results.BadRequest(new { message = "Geçersiz Google kimlik jetonu." });
        }

        var normalizedEmail = payload.Email.Trim().ToLower();
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user == null)
        {
            if (!dto.AllowRegister)
            {
                return Results.NotFound(new
                {
                    message = "Bu Google hesabına ait bir FinAI hesabı bulunamadı. Lütfen Kayıt Ol sayfasından KVKK metnini onaylayarak devam edin.",
                    accountNotFound = true
                });
            }

            var isFirstUser = !await dbContext.Users.AnyAsync();
            user = new User
            {
                ExternalUserId = normalizedEmail,
                Email = normalizedEmail,
                Name = string.IsNullOrWhiteSpace(payload.Name) ? normalizedEmail : payload.Name,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))),
                IsAdmin = isFirstUser
            };
            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync();
        }

        var (accessToken, refreshToken) = GenerateTokenPair(user, config);
        dbContext.RefreshTokens.Add(refreshToken);
        await dbContext.SaveChangesAsync();

        return Results.Ok(new
        {
            accessToken,
            refreshToken = refreshToken.Token,
            token = accessToken, // Backwards compatibility for existing client state
            user = new { id = user.ExternalUserId, name = user.Name, email = user.Email, isAdmin = user.IsAdmin }
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Google girişi hatası: {ex.InnerException?.Message ?? ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// AUTH ENDPOINT 3: REFRESH TOKEN ROTATION
// ---------------------------------------------------------
app.MapPost("/api/auth/refresh", async (RefreshTokenRequestDto dto, AppDbContext dbContext, IConfiguration config) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(dto.RefreshToken))
        {
            return Results.BadRequest(new { message = "Refresh token gereklidir." });
        }

        var existingToken = await dbContext.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == dto.RefreshToken);

        if (existingToken == null || !existingToken.IsActive)
        {
            return Results.Unauthorized();
        }

        // Token rotation: mark old refresh token as revoked
        var (newAccessToken, newRefreshToken) = GenerateTokenPair(existingToken.User, config);
        existingToken.RevokedAt = DateTime.UtcNow;
        existingToken.ReplacedByToken = newRefreshToken.Token;

        dbContext.RefreshTokens.Add(newRefreshToken);
        await dbContext.SaveChangesAsync();

        return Results.Ok(new
        {
            accessToken = newAccessToken,
            refreshToken = newRefreshToken.Token,
            token = newAccessToken
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Token yenileme hatası: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// AUTH ENDPOINT 4: REVOKE REFRESH TOKEN (LOGOUT)
// ---------------------------------------------------------
app.MapPost("/api/auth/revoke", async (RevokeTokenRequestDto dto, AppDbContext dbContext) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(dto.RefreshToken))
        {
            return Results.BadRequest(new { message = "Refresh token gereklidir." });
        }

        var existingToken = await dbContext.RefreshTokens.FirstOrDefaultAsync(r => r.Token == dto.RefreshToken);
        if (existingToken != null && existingToken.IsActive)
        {
            existingToken.RevokedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync();
        }

        return Results.Ok(new { message = "Oturum başarıyla sonlandırıldı." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"İptal hatası: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// AUTH ENDPOINT 5: FORGOT PASSWORD (E-POSTA İLE ŞİFRE SIFIRLAMA LİNKİ)
// ---------------------------------------------------------
app.MapPost("/api/auth/forgot-password", async (ForgotPasswordDto dto, AppDbContext dbContext, IEmailService emailService) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            return Results.BadRequest(new { message = "E-posta adresi gereklidir." });
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.Trim().ToLower());
        if (user == null)
        {
            return Results.NotFound(new { message = "Bu e-posta adresine ait kayıtlı kullanıcı bulunamadı." });
        }

        // 30 dakikalık güvenli token ve sıfırlama bağlantısı üret
        var resetToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(16));
        user.ResetToken = resetToken;
        user.ResetTokenExpiresAt = DateTime.UtcNow.AddMinutes(30);
        await dbContext.SaveChangesAsync();

        var resetLink = $"http://localhost:3000/reset-password?email={Uri.EscapeDataString(user.Email)}&token={resetToken}";

        // E-Posta gönder
        var isSent = await emailService.SendPasswordResetEmailAsync(user.Email, resetLink);

        // Güvenlik: sıfırlama token'ı yalnızca e-posta ile iletilir, API cevabında asla döndürülmez.
        if (isSent)
        {
            return Results.Ok(new
            {
                message = $"Şifre sıfırlama e-postası {user.Email} adresine gönderildi. Lütfen e-posta kutunuzu kontrol edin."
            });
        }
        else
        {
            return Results.Ok(new
            {
                message = "Şifre sıfırlama talebiniz alındı ancak e-posta gönderimi şu an yapılandırılmamış. Lütfen sistem yöneticisiyle iletişime geçin."
            });
        }
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Şifre sıfırlama hatası: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// AUTH ENDPOINT 6: RESET PASSWORD (GÜVENLİ LİNK İLE ŞİFRE SIFIRLAMA)
// ---------------------------------------------------------
app.MapPost("/api/auth/reset-password", async (ResetPasswordDto dto, AppDbContext dbContext) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            return Results.BadRequest(new { message = "E-posta ve yeni şifre gereklidir." });
        }

        if (dto.NewPassword.Length < 6)
        {
            return Results.BadRequest(new { message = "Yeni şifre en az 6 karakter olmalıdır." });
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.Trim().ToLower());
        if (user == null)
        {
            return Results.NotFound(new { message = "Bu e-posta adresine ait kullanıcı bulunamadı." });
        }

        // Token ZORUNLU: geçerli, süresi dolmamış ve kullanıcıya ait olmalı.
        // Token olmadan şifre sıfırlanamaz (aksi halde e-posta bilen herkes hesabı ele geçirebilirdi).
        if (string.IsNullOrWhiteSpace(dto.Token) ||
            string.IsNullOrWhiteSpace(user.ResetToken) ||
            user.ResetToken != dto.Token ||
            !user.ResetTokenExpiresAt.HasValue ||
            user.ResetTokenExpiresAt.Value < DateTime.UtcNow)
        {
            return Results.BadRequest(new { message = "Geçersiz veya süresi dolmuş sıfırlama bağlantısı." });
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.ResetToken = null;
        user.ResetTokenExpiresAt = null;
        await dbContext.SaveChangesAsync();

        return Results.Ok(new { message = "Şifreniz başarıyla güncellendi! Yeni şifrenizle giriş yapabilirsiniz." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Şifre yenileme hatası: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 3: AI ile Harcama Ayrıştırma
// ---------------------------------------------------------
app.MapPost("/api/parse-transaction", async (TransactionRequestDto dto, IAiClientService aiClient, IPiiMaskingService piiMasker, AppDbContext dbContext) =>
{
    // Hassas verileri (IBAN, Kredi Kartı, Telefon vb.) maskele
    var maskedText = piiMasker.MaskSensitiveData(dto.InputText);

    // Maskelenmiş veriyi AI servisine gönder
    var parsedResult = await aiClient.ProcessTransactionAsync(dto.UserId, maskedText);

    if (!parsedResult.IsSuccessful)
    {
        return Results.BadRequest(new { message = "İşlem ayrıştırılamadı. AI servisini kontrol edin." });
    }

    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == dto.UserId);
    if (user == null)
    {
        user = new User
        {
            ExternalUserId = dto.UserId,
            Email = dto.UserId,
            Name = dto.UserId,
            PasswordHash = "DEFAULT_HASH"
        };
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();
    }

    // Mükerrer kayıt (Duplicate Transaction) engelleme: Son 5 dakika içindeki aynı kullanıcı, tutar ve işyeri
    var fiveMinsAgo = DateTime.UtcNow.AddMinutes(-5);
    var duplicateTx = await dbContext.Transactions.FirstOrDefaultAsync(t =>
        t.UserId == user.Id &&
        t.Amount == (decimal)parsedResult.Amount &&
        t.MerchantOrTitle.ToLower() == parsedResult.MerchantOrTitle.ToLower() &&
        t.CreatedAt >= fiveMinsAgo);

    if (duplicateTx != null)
    {
        return Results.Ok(new
        {
            TransactionId = duplicateTx.Id,
            ParsedData = parsedResult,
            IsDuplicate = true,
            message = "Bu işlem zaten kayıtlı (mükerrer kayıt engellendi)."
        });
    }

    var transaction = new Transaction
    {
        UserId = user.Id,
        Intent = parsedResult.Intent,
        Amount = (decimal)parsedResult.Amount,
        Category = parsedResult.Category,
        MerchantOrTitle = parsedResult.MerchantOrTitle,
        RawText = dto.InputText, // Veritabanında kullanıcının kendi referansı için orijinalini sakla
        ConfidenceScore = parsedResult.ConfidenceScore
    };

    dbContext.Transactions.Add(transaction);
    await dbContext.SaveChangesAsync();

    // Madde 12 & Madde 28: Otomatik Bütçe Limiti Kontrolü & Anomali Taraması
    await CheckAndNotifyBudgetLimits(user.Id, transaction.Category, dbContext);

    return Results.Ok(new
    {
        TransactionId = transaction.Id,
        ParsedData = parsedResult
    });
}).RequireRateLimiting("gemini-policy").AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 4: Geçmiş Harcamaları Getirme (Filtreli)
// ---------------------------------------------------------
app.MapGet("/api/transactions/{userId}", async (string userId, string? range, AppDbContext dbContext) =>
{
    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == userId);
    if (user == null)
    {
        return Results.Ok(new List<object>());
    }

    var query = dbContext.Transactions.Where(t => t.UserId == user.Id);
    query = ApplyDateFilter(query, range);

    var list = await query
        .OrderByDescending(t => t.CreatedAt)
        .Select(t => new
        {
            TransactionId = t.Id,
            ParsedData = new
            {
                IsSuccessful = true,
                Intent = t.Intent,
                Amount = t.Amount,
                Category = t.Category,
                MerchantOrTitle = t.MerchantOrTitle,
                TransactionDate = t.CreatedAt.AddHours(3).ToString("yyyy-MM-dd"),
                ConfidenceScore = t.ConfidenceScore
            }
        })
        .ToListAsync();

    return Results.Ok(list);
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 4.1: Finansal Rapor Dışa Aktarma (Excel/PDF)
// ---------------------------------------------------------
app.MapGet("/api/reports/export", async (string userId, string? format, string? range, AppDbContext dbContext) =>
{
    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == userId);
    if (user == null)
    {
        return Results.NotFound(new { message = "Kullanıcı bulunamadı." });
    }

    var query = dbContext.Transactions.Where(t => t.UserId == user.Id);
    query = ApplyDateFilter(query, range);
    var list = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();

    var exportFormat = (format ?? "excel").ToLower();
    var rangeText = string.IsNullOrWhiteSpace(range) ? "Tüm Zamanlar" : range;

    if (exportFormat == "pdf" || exportFormat == "html")
    {
        var totalSpent = list.Where(t => t.Intent == "EXPENSE").Sum(t => t.Amount);
        var totalIncome = list.Where(t => t.Intent == "INCOME").Sum(t => t.Amount);

        var htmlBuilder = new StringBuilder();
        htmlBuilder.AppendLine("<!DOCTYPE html><html lang='tr'><head><meta charset='UTF-8'><title>FinAI Finansal Rapor</title>");
        htmlBuilder.AppendLine("<style>");
        htmlBuilder.AppendLine("body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; background-color: #fff; }");
        htmlBuilder.AppendLine(".header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }");
        htmlBuilder.AppendLine(".header h1 { color: #4f46e5; margin: 0; }");
        htmlBuilder.AppendLine(".summary-box { display: flex; justify-content: space-around; background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; }");
        htmlBuilder.AppendLine(".summary-item { text-align: center; }");
        htmlBuilder.AppendLine(".summary-item h3 { margin: 0; color: #64748b; font-size: 14px; }");
        htmlBuilder.AppendLine(".summary-item p { margin: 5px 0 0 0; font-size: 24px; font-weight: bold; }");
        htmlBuilder.AppendLine("table { width: 100%; border-collapse: collapse; margin-top: 20px; }");
        htmlBuilder.AppendLine("th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 14px; }");
        htmlBuilder.AppendLine("th { background-color: #4f46e5; color: white; }");
        htmlBuilder.AppendLine("tr:nth-child(even) { background-color: #f8fafc; }");
        htmlBuilder.AppendLine("@media print { body { padding: 0; } }");
        htmlBuilder.AppendLine("</style></head><body>");

        htmlBuilder.AppendLine("<div class='header'>");
        htmlBuilder.AppendLine("<h1>🚀 FinAI Finansal İşlem Raporu</h1>");
        htmlBuilder.AppendLine($"<p>Kullanıcı: <strong>{user.Name} ({user.Email})</strong> | Tarih Aralığı: <strong>{rangeText}</strong> | Rapor Tarihi: {DateTime.Now:dd.MM.yyyy HH:mm}</p>");
        htmlBuilder.AppendLine("</div>");

        htmlBuilder.AppendLine("<div class='summary-box'>");
        htmlBuilder.AppendLine($"<div class='summary-item'><h3>TOPLAM İŞLEM</h3><p>{list.Count}</p></div>");
        htmlBuilder.AppendLine($"<div class='summary-item'><h3>TOPLAM GELİR</h3><p style='color:#10b981;'>₺{totalIncome:N2}</p></div>");
        htmlBuilder.AppendLine($"<div class='summary-item'><h3>TOPLAM HARCAMA</h3><p style='color:#ef4444;'>₺{totalSpent:N2}</p></div>");
        htmlBuilder.AppendLine("</div>");

        htmlBuilder.AppendLine("<table><thead><tr><th>Tarih</th><th>İşyeri / Başlık</th><th>Kategori</th><th>Tür</th><th>Tutar (₺)</th></tr></thead><tbody>");
        foreach (var item in list)
        {
            var isIncome = item.Intent == "INCOME";
            htmlBuilder.AppendLine($"<tr><td>{item.CreatedAt:yyyy-MM-dd}</td><td>{item.MerchantOrTitle}</td><td>{item.Category}</td><td>{(isIncome ? "Gelir" : "Gider")}</td><td style='color:{(isIncome ? "#10b981" : "#ef4444")}; font-weight:bold;'>{(isIncome ? "+" : "-")}₺{item.Amount:N2}</td></tr>");
        }
        htmlBuilder.AppendLine("</tbody></table>");
        htmlBuilder.AppendLine("<script>window.onload = function() { window.print(); };</script>");
        htmlBuilder.AppendLine("</body></html>");

        return Results.Content(htmlBuilder.ToString(), "text/html; charset=utf-8");
    }
    else
    {
        var csvBuilder = new StringBuilder();
        csvBuilder.AppendLine("İşlem ID;Tarih;İşlem Türü;Kategori;İşyeri/Başlık;Tutar (TL);Güven Skoru");

        foreach (var item in list)
        {
            csvBuilder.AppendLine($"\"{item.Id}\";\"{item.CreatedAt:yyyy-MM-dd HH:mm}\";\"{item.Intent}\";\"{item.Category}\";\"{item.MerchantOrTitle}\";\"{item.Amount}\";\"%{Math.Round(item.ConfidenceScore * 100, 1)}\"");
        }

        var preamble = Encoding.UTF8.GetPreamble();
        var bytes = Encoding.UTF8.GetBytes(csvBuilder.ToString());
        var resultBytes = preamble.Concat(bytes).ToArray();

        return Results.File(resultBytes, "text/csv; charset=utf-8", $"FinAI_Raporu_{rangeText}.csv");
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 5: Gemini AI Finansal Tavsiye ve Analiz Üretme
// ---------------------------------------------------------
app.MapGet("/api/insights/{userId}", async (string userId, IAiClientService aiClient, AppDbContext dbContext) =>
{
    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == userId);
    if (user == null)
    {
        return Results.NotFound("Kullanıcı bulunamadı.");
    }

    var transactions = await dbContext.Transactions
        .Where(t => t.UserId == user.Id)
        .ToListAsync();

    if (!transactions.Any())
    {
        return Results.Ok(new
        {
            InsightText = "Henüz kaydedilmiş bir harcamanız bulunmuyor. Harcama ekledikçe AI finansal analizinizi burada görebilirsiniz.",
            RiskLevel = "Low",
            Recommendations = new[] { "İlk harcamanızı ekleyerek başlayın!" }
        });
    }

    // Harcamaları kategoriye göre gruplayıp JSON özeti oluştur
    var summary = transactions
        .GroupBy(t => t.Category)
        .Select(g => new { Category = g.Key, TotalAmount = g.Sum(t => t.Amount), Count = g.Count() })
        .ToList();

    var summaryJson = System.Text.Json.JsonSerializer.Serialize(summary);

    var insight = await aiClient.GetFinancialInsightAsync(userId, summaryJson);

    return Results.Ok(new
    {
        InsightText = insight.InsightText,
        RiskLevel = insight.RiskLevel,
        Recommendations = insight.Recommendations
    });
}).RequireRateLimiting("gemini-policy").AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 6: Kullanıcı Bütçe Limit Özetlerini Getirme
// ---------------------------------------------------------
app.MapGet("/api/budgets/summary/{userId}", async (string userId, AppDbContext dbContext) =>
{
    try
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == userId);
        if (user == null)
        {
            return Results.NotFound(new { message = "Kullanıcı bulunamadı." });
        }

        var budgets = await dbContext.BudgetLimits
            .Where(b => b.UserId == user.Id)
            .ToListAsync();

        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var categoryExpenses = await dbContext.Transactions
            .Where(t => t.UserId == user.Id && t.CreatedAt >= startOfMonth && t.Intent == "EXPENSE")
            .GroupBy(t => t.Category)
            .Select(g => new { Category = g.Key, TotalSpent = g.Sum(t => t.Amount) })
            .ToListAsync();

        var expenseDict = categoryExpenses.ToDictionary(x => x.Category, x => x.TotalSpent);

        var summary = budgets.Select(b => {
            expenseDict.TryGetValue(b.Category, out var spent);
            return new {
                BudgetId = b.Id,
                Category = b.Category,
                LimitAmount = b.LimitAmount,
                CurrentSpent = spent,
                Percentage = b.LimitAmount > 0 ? Math.Round((double)(spent / b.LimitAmount) * 100, 1) : 0
            };
        }).ToList();

        return Results.Ok(summary);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Bütçe özeti getirilirken hata oluştu: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 7: Bütçe Limiti Ekleme veya Güncelleme (Upsert)
// ---------------------------------------------------------
app.MapPost("/api/budgets", async (BudgetLimitRequestDto dto, AppDbContext dbContext) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(dto.UserId) || string.IsNullOrWhiteSpace(dto.Category) || dto.LimitAmount <= 0)
        {
            return Results.BadRequest(new { message = "Geçersiz bütçe bilgileri." });
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == dto.UserId);
        if (user == null)
        {
            return Results.NotFound(new { message = "Kullanıcı bulunamadı." });
        }

        var existingBudget = await dbContext.BudgetLimits
            .FirstOrDefaultAsync(b => b.UserId == user.Id && b.Category == dto.Category);

        if (existingBudget != null)
        {
            existingBudget.LimitAmount = dto.LimitAmount;
            existingBudget.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            var budget = new BudgetLimit
            {
                UserId = user.Id,
                Category = dto.Category,
                LimitAmount = dto.LimitAmount
            };
            dbContext.BudgetLimits.Add(budget);
        }

        await dbContext.SaveChangesAsync();
        return Results.Ok(new { message = "Bütçe limiti başarıyla kaydedildi." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Bütçe kaydedilirken hata oluştu: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 8: Bütçe Limiti Silme
// ---------------------------------------------------------
app.MapDelete("/api/budgets/{budgetId}", async (Guid budgetId, AppDbContext dbContext) =>
{
    try
    {
        var budget = await dbContext.BudgetLimits.FindAsync(budgetId);
        if (budget == null)
        {
            return Results.NotFound(new { message = "Bütçe limiti bulunamadı." });
        }

        dbContext.BudgetLimits.Remove(budget);
        await dbContext.SaveChangesAsync();

        return Results.Ok(new { message = "Bütçe limiti başarıyla silindi." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Bütçe silinirken hata oluştu: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9: CSV Banka Ekstresi Toplu İçe Aktarma (Bulk Import)
// ---------------------------------------------------------
app.MapPost("/api/transactions/import", async (HttpRequest request, ClaimsPrincipal principal, AppDbContext dbContext, IAiClientService aiClient, IPiiMaskingService piiMasker) =>
{
    try
    {
        if (!request.HasFormContentType)
        {
            return Results.BadRequest(new { message = "İçerik tipi multipart/form-data olmalıdır." });
        }

        var form = await request.ReadFormAsync();
        var file = form.Files.GetFile("file");
        if (file == null || file.Length == 0)
        {
            return Results.BadRequest(new { message = "Dosya yüklenmedi veya dosya boş." });
        }

        // Kullanıcı kimliği istemciden değil, doğrulanmış JWT'den alınır
        var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        var dateColumn = form["dateColumn"].ToString();
        var descriptionColumn = form["descriptionColumn"].ToString();
        var amountColumn = form["amountColumn"].ToString();

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Results.Unauthorized();
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == userId);
        if (user == null)
        {
            return Results.NotFound(new { message = "Kullanıcı bulunamadı." });
        }

        List<string> headers = new();
        List<List<string>> rowsData = new();

        bool isExcel = file.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase) || 
                      file.FileName.EndsWith(".xls", StringComparison.OrdinalIgnoreCase);

        if (isExcel)
        {
            using var stream = file.OpenReadStream();
            using var excelReader = ExcelReaderFactory.CreateReader(stream);
            var result = excelReader.AsDataSet();
            if (result.Tables.Count > 0 && result.Tables[0].Rows.Count > 0)
            {
                var table = result.Tables[0];
                for (int c = 0; c < table.Columns.Count; c++)
                {
                    headers.Add(table.Rows[0][c]?.ToString()?.Trim('"', ' ', '\r', '\n') ?? $"Column{c}");
                }
                for (int r = 1; r < table.Rows.Count; r++)
                {
                    var rowValues = new List<string>();
                    for (int c = 0; c < table.Columns.Count; c++)
                    {
                        rowValues.Add(table.Rows[r][c]?.ToString()?.Trim('"', ' ', '\r', '\n') ?? "");
                    }
                    rowsData.Add(rowValues);
                }
            }
        }
        else
        {
            using var reader = new StreamReader(file.OpenReadStream());
            var headerLine = await reader.ReadLineAsync();
            if (headerLine == null)
            {
                return Results.BadRequest(new { message = "Dosya içeriği boş." });
            }

            if (headerLine.StartsWith("PK") || headerLine.Contains("[Content_Types].xml"))
            {
                using var excelStream = file.OpenReadStream();
                using var excelReader = ExcelReaderFactory.CreateReader(excelStream);
                var result = excelReader.AsDataSet();
                if (result.Tables.Count > 0 && result.Tables[0].Rows.Count > 0)
                {
                    var table = result.Tables[0];
                    for (int c = 0; c < table.Columns.Count; c++)
                    {
                        headers.Add(table.Rows[0][c]?.ToString()?.Trim('"', ' ', '\r', '\n') ?? $"Column{c}");
                    }
                    for (int r = 1; r < table.Rows.Count; r++)
                    {
                        var rowValues = new List<string>();
                        for (int c = 0; c < table.Columns.Count; c++)
                        {
                            rowValues.Add(table.Rows[r][c]?.ToString()?.Trim('"', ' ', '\r', '\n') ?? "");
                        }
                        rowsData.Add(rowValues);
                    }
                }
            }
            else
            {
                char delimiter = headerLine.Contains(';') ? ';' : ',';
                headers = headerLine.Split(delimiter).Select(h => h.Trim('"', ' ', '\r', '\n')).ToList();

                string? line;
                while ((line = await reader.ReadLineAsync()) != null)
                {
                    if (string.IsNullOrWhiteSpace(line)) continue;
                    var values = line.Split(delimiter).Select(v => v.Trim('"', ' ', '\r', '\n')).ToList();
                    rowsData.Add(values);
                }
            }
        }

        // Kolon indekslerini bul
        int dateIdx = headers.FindIndex(h => h.Equals(dateColumn, StringComparison.OrdinalIgnoreCase));
        int descIdx = headers.FindIndex(h => h.Equals(descriptionColumn, StringComparison.OrdinalIgnoreCase));
        int amtIdx = headers.FindIndex(h => h.Equals(amountColumn, StringComparison.OrdinalIgnoreCase));

        // Eğer isimle bulunamadıysa sayısal indeks araması yap
        if (dateIdx == -1 && int.TryParse(dateColumn, out int dIdx)) dateIdx = dIdx;
        if (descIdx == -1 && int.TryParse(descriptionColumn, out int dsIdx)) descIdx = dsIdx;
        if (amtIdx == -1 && int.TryParse(amountColumn, out int aIdx)) amtIdx = aIdx;

        if (dateIdx == -1 || descIdx == -1 || amtIdx == -1 ||
            dateIdx >= headers.Count || descIdx >= headers.Count || amtIdx >= headers.Count)
        {
            return Results.BadRequest(new { message = $"Sütun eşleme başarısız. Sütunlar: {string.Join(", ", headers)}" });
        }

        var transactionsList = new List<Transaction>();
        foreach (var values in rowsData)
        {
            if (values.Count <= Math.Max(dateIdx, Math.Max(descIdx, amtIdx))) continue;

            var rawDate = values[dateIdx];
            var rawDesc = values[descIdx];
            var rawAmt = values[amtIdx];

            if (string.IsNullOrWhiteSpace(rawDesc) || string.IsNullOrWhiteSpace(rawAmt)) continue;

            // Tutar bilgisini temizle ve parse et
            rawAmt = rawAmt.Replace("TL", "").Replace("₺", "").Replace(" ", "").Trim();
            if (!decimal.TryParse(rawAmt, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out decimal amtVal))
            {
                decimal.TryParse(rawAmt, System.Globalization.NumberStyles.Any, new System.Globalization.CultureInfo("tr-TR"), out amtVal);
            }

            DateTime.TryParse(rawDate, out DateTime parsedDate);
            if (parsedDate == default) parsedDate = DateTime.UtcNow;

            var maskedText = piiMasker.MaskSensitiveData(rawDesc);

            // Gemini API ile açıklamayı analiz et
            var parsedResult = await aiClient.ProcessTransactionAsync(userId, $"{maskedText} {amtVal} TL");

            if (parsedResult.IsSuccessful)
            {
                var transaction = new Transaction
                {
                    UserId = user.Id,
                    Intent = parsedResult.Intent,
                    Amount = amtVal > 0 ? amtVal : (decimal)parsedResult.Amount,
                    Category = parsedResult.Category,
                    MerchantOrTitle = parsedResult.MerchantOrTitle,
                    RawText = rawDesc, // Kullanıcıya orijinalini sakla
                    ConfidenceScore = parsedResult.ConfidenceScore,
                    TransactionDate = parsedDate.ToUniversalTime(),
                    CreatedAt = DateTime.UtcNow
                };
                transactionsList.Add(transaction);
            }
        }

        if (transactionsList.Any())
        {
            dbContext.Transactions.AddRange(transactionsList);
            await dbContext.SaveChangesAsync();
        }

        return Results.Ok(new { message = $"{transactionsList.Count} adet işlem başarıyla içe aktarıldı." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"CSV aktarım hatası: {ex.Message}" });
    }
}).RequireRateLimiting("gemini-policy").DisableAntiforgery().RequireAuthorization();

// ---------------------------------------------------------
// ENDPOINT 9.1: Fiş Görseli Yükleme & Gemini Vision OCR Analizi
// ---------------------------------------------------------
app.MapPost("/api/receipts/upload", async (HttpRequest request, ClaimsPrincipal principal, AppDbContext dbContext, IAiClientService aiClient) =>
{
    try
    {
        byte[] imageBytes;
        string contentType;
        // Kullanıcı kimliği istemciden değil, doğrulanmış JWT'den alınır
        string userId = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Results.Unauthorized();
        }

        if (request.HasFormContentType)
        {
            var form = await request.ReadFormAsync();
            var file = form.Files.GetFile("file");

            if (file == null || file.Length == 0)
            {
                return Results.BadRequest(new { message = "Geçersiz dosya." });
            }

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            imageBytes = ms.ToArray();
            contentType = string.IsNullOrWhiteSpace(file.ContentType) ? "image/jpeg" : file.ContentType;
        }
        else
        {
            using var reader = new StreamReader(request.Body);
            var bodyText = await reader.ReadToEndAsync();
            using var doc = System.Text.Json.JsonDocument.Parse(bodyText);
            var root = doc.RootElement;

            var imageBase64 = root.GetProperty("imageBase64").GetString() ?? "";
            contentType = root.TryGetProperty("mimeType", out var mimeProp) ? mimeProp.GetString() ?? "image/jpeg" : "image/jpeg";

            if (string.IsNullOrWhiteSpace(imageBase64))
            {
                return Results.BadRequest(new { message = "Geçersiz görsel verisi." });
            }

            if (imageBase64.Contains(","))
            {
                imageBase64 = imageBase64.Split(',')[1];
            }

            imageBytes = Convert.FromBase64String(imageBase64);
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == userId);
        if (user == null)
        {
            return Results.NotFound(new { message = "Kullanıcı bulunamadı." });
        }

        var ocrResult = await aiClient.ExtractReceiptDataAsync(userId, imageBytes, contentType);
        if (!ocrResult.IsSuccessful)
        {
            return Results.BadRequest(new { message = "Fiş analizi başarısız oldu." });
        }

        var receipt = new Receipt
        {
            UserId = user.Id,
            MerchantName = ocrResult.MerchantName,
            TotalAmount = (decimal)ocrResult.TotalAmount,
            Category = ocrResult.Category,
            ExtractedDataJson = ocrResult.ItemsJson,
            ConfidenceScore = ocrResult.ConfidenceScore,
            Status = "PENDING"
        };

        dbContext.Receipts.Add(receipt);
        await dbContext.SaveChangesAsync();

        var resultObject = new
        {
            ReceiptId = receipt.Id,
            MerchantName = receipt.MerchantName,
            TotalAmount = receipt.TotalAmount,
            Category = receipt.Category,
            DateStr = ocrResult.DateStr,
            ItemsJson = receipt.ExtractedDataJson,
            ConfidenceScore = receipt.ConfidenceScore,
            parsedReceipt = new
            {
                merchantName = receipt.MerchantName,
                totalAmount = receipt.TotalAmount,
                category = receipt.Category,
                dateStr = ocrResult.DateStr
            }
        };

        return Results.Ok(resultObject);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Fiş yükleme hatası: {ex.Message}" });
    }
}).RequireRateLimiting("gemini-policy").DisableAntiforgery().RequireAuthorization();

// ---------------------------------------------------------
// ENDPOINT 9.2: Fişi İşlem Olarak Onaylama & Kaydetme
// ---------------------------------------------------------
app.MapPost("/api/receipts/{id}/confirm", async (Guid id, ConfirmReceiptDto dto, AppDbContext dbContext) =>
{
    try
    {
        var receipt = await dbContext.Receipts.Include(r => r.User).FirstOrDefaultAsync(r => r.Id == id);
        if (receipt == null)
        {
            return Results.NotFound(new { message = "Fiş bulunamadı." });
        }

        if (receipt.Status == "SAVED" && receipt.TransactionId.HasValue)
        {
            return Results.Ok(new { message = "Bu fiş daha önce zaten onaylandı ve kaydedildi.", TransactionId = receipt.TransactionId.Value, IsDuplicate = true });
        }

        var merchantName = string.IsNullOrWhiteSpace(dto.MerchantName) ? receipt.MerchantName : dto.MerchantName;
        var amount = dto.Amount;

        // Son 10 dakika içinde aynı tutar ve işyeri ile kaydedilmiş harcama var mı?
        var tenMinsAgo = DateTime.UtcNow.AddMinutes(-10);
        var existingTx = await dbContext.Transactions.FirstOrDefaultAsync(t =>
            t.UserId == receipt.UserId &&
            t.Amount == amount &&
            t.MerchantOrTitle.ToLower() == merchantName.ToLower() &&
            t.CreatedAt >= tenMinsAgo);

        if (existingTx != null)
        {
            receipt.Status = "SAVED";
            receipt.TransactionId = existingTx.Id;
            await dbContext.SaveChangesAsync();
            return Results.Ok(new { message = "Bu fiş kaydı mükerrer olarak engellendi ve mevcut harcamaya bağlandı.", TransactionId = existingTx.Id, IsDuplicate = true });
        }

        var transaction = new Transaction
        {
            UserId = receipt.UserId,
            Intent = "EXPENSE",
            Amount = dto.Amount,
            Category = string.IsNullOrWhiteSpace(dto.Category) ? receipt.Category : dto.Category,
            MerchantOrTitle = merchantName,
            RawText = $"Fiş OCR: {merchantName} (₺{dto.Amount})",
            ConfidenceScore = (float)receipt.ConfidenceScore,
            TransactionDate = dto.TransactionDate.ToUniversalTime(),
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Transactions.Add(transaction);
        await dbContext.SaveChangesAsync();

        receipt.Status = "SAVED";
        receipt.TransactionId = transaction.Id;
        await dbContext.SaveChangesAsync();

        return Results.Ok(new { message = "Fiş başarıyla harcama işlemine dönüştürüldü.", TransactionId = transaction.Id });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Fiş onaylama hatası: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.3: Kullanıcının Fiş Geçmişini Getirme
// ---------------------------------------------------------
app.MapGet("/api/receipts/{userId}", async (string userId, AppDbContext dbContext) =>
{
    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == userId);
    if (user == null)
    {
        return Results.Ok(new List<object>());
    }

    var list = await dbContext.Receipts
        .Where(r => r.UserId == user.Id)
        .OrderByDescending(r => r.CreatedAt)
        .Select(r => new
        {
            r.Id,
            r.MerchantName,
            r.TotalAmount,
            r.Category,
            r.Status,
            r.ConfidenceScore,
            r.CreatedAt,
            r.TransactionId
        })
        .ToListAsync();

    return Results.Ok(list);
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.4: Yapay Zeka ile Tekrarlayan Ödeme Tespiti
// ---------------------------------------------------------
app.MapPost("/api/recurring-transactions/detect", async (DetectRecurringDto dto, AppDbContext dbContext, IAiClientService aiClient) =>
{
    try
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == dto.UserId);
        if (user == null)
        {
            return Results.NotFound(new { message = "Kullanıcı bulunamadı." });
        }

        var pastTx = await dbContext.Transactions
            .Where(t => t.UserId == user.Id && t.Intent == "EXPENSE")
            .OrderByDescending(t => t.CreatedAt)
            .Take(100)
            .Select(t => new { t.MerchantOrTitle, t.Amount, t.Category, t.CreatedAt })
            .ToListAsync();

        var jsonStr = System.Text.Json.JsonSerializer.Serialize(pastTx);
        var response = await aiClient.DetectRecurringPaymentsAsync(dto.UserId, jsonStr);

        if (!response.IsSuccessful)
        {
            return Results.BadRequest(new { message = "Abonelikler tespit edilemedi." });
        }

        using var doc = System.Text.Json.JsonDocument.Parse(response.DetectedSubscriptionsJson);
        var addedCount = 0;

        foreach (var element in doc.RootElement.EnumerateArray())
        {
            var merchant = element.GetProperty("merchant_name").GetString() ?? "Bilinmeyen";
            var amount = element.GetProperty("amount").GetDecimal();
            var category = element.GetProperty("category").GetString() ?? "Diğer";
            var frequency = element.GetProperty("frequency").GetString() ?? "Monthly";

            var existing = await dbContext.RecurringTransactions
                .FirstOrDefaultAsync(rt => rt.UserId == user.Id && rt.MerchantName.ToLower() == merchant.ToLower());

            if (existing == null)
            {
                var rt = new RecurringTransaction
                {
                    UserId = user.Id,
                    MerchantName = merchant,
                    Amount = amount,
                    Category = category,
                    Frequency = frequency,
                    NextDueDate = DateTime.UtcNow.AddMonths(1),
                    IsActive = true
                };
                dbContext.RecurringTransactions.Add(rt);
                addedCount++;
            }
        }

        await dbContext.SaveChangesAsync();
        return Results.Ok(new { message = $"{addedCount} adet yeni tekrarlayan ödeme / abonelik tespit edildi." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Tespit hatası: {ex.Message}" });
    }
}).RequireRateLimiting("gemini-policy").AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.5: Kullanıcının Tekrarlayan Ödemelerini Getirme
// ---------------------------------------------------------
app.MapGet("/api/recurring-transactions/{userId}", async (string userId, AppDbContext dbContext) =>
{
    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == userId || u.Id.ToString() == userId);
    if (user == null)
    {
        return Results.Ok(new { items = new List<object>(), monthlyTotal = 0 });
    }

    var list = await dbContext.RecurringTransactions
        .Where(rt => rt.UserId == user.Id)
        .OrderByDescending(rt => rt.CreatedAt)
        .Select(rt => new
        {
            id = rt.Id,
            merchantName = rt.MerchantName,
            amount = rt.Amount,
            category = rt.Category,
            frequency = rt.Frequency,
            nextDueDate = rt.NextDueDate,
            isActive = rt.IsActive,
            createdAt = rt.CreatedAt
        })
        .ToListAsync();

    var monthlyTotal = list.Where(rt => rt.isActive).Sum(rt => rt.frequency == "Yearly" ? rt.amount / 12 : (rt.frequency == "Weekly" ? rt.amount * 4 : rt.amount));

    return Results.Ok(new { items = list, monthlyTotal = Math.Round(monthlyTotal, 2) });
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.6: Tekrarlayan Ödeme Ekleme veya Güncelleme
// ---------------------------------------------------------
app.MapPost("/api/recurring-transactions", async (RecurringTransactionDto dto, AppDbContext dbContext) =>
{
    try
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == dto.UserId || u.Id.ToString() == dto.UserId);
        if (user == null)
        {
            return Results.NotFound(new { message = "Kullanıcı bulunamadı." });
        }

        var existing = await dbContext.RecurringTransactions
            .FirstOrDefaultAsync(rt => rt.UserId == user.Id && rt.MerchantName.ToLower() == dto.MerchantName.ToLower());

        if (existing != null)
        {
            existing.Amount = dto.Amount;
            existing.Category = dto.Category;
            existing.Frequency = dto.Frequency;
            existing.NextDueDate = dto.NextDueDate.ToUniversalTime();
            existing.IsActive = dto.IsActive;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            var rt = new RecurringTransaction
            {
                UserId = user.Id,
                MerchantName = dto.MerchantName,
                Amount = dto.Amount,
                Category = dto.Category,
                Frequency = dto.Frequency,
                NextDueDate = dto.NextDueDate.ToUniversalTime(),
                IsActive = dto.IsActive
            };
            dbContext.RecurringTransactions.Add(rt);
        }

        await dbContext.SaveChangesAsync();
        return Results.Ok(new { message = "Tekrarlayan ödeme başarıyla kaydedildi." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Kaydetme hatası: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.7: Tekrarlayan Ödeme Silme
// ---------------------------------------------------------
app.MapDelete("/api/recurring-transactions/{id}", async (Guid id, AppDbContext dbContext) =>
{
    try
    {
        var rt = await dbContext.RecurringTransactions.FindAsync(id);
        if (rt == null)
        {
            return Results.NotFound(new { message = "Kayıt bulunamadı." });
        }

        dbContext.RecurringTransactions.Remove(rt);
        await dbContext.SaveChangesAsync();

        return Results.Ok(new { message = "Tekrarlayan ödeme kaydı silindi." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Silme hatası: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.8: Yapay Zeka ile Anomali Tespiti ve Bildirim Oluşturma
// ---------------------------------------------------------
app.MapPost("/api/notifications/detect-anomalies", async (DetectAnomaliesDto dto, AppDbContext dbContext, IAiClientService aiClient) =>
{
    try
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == dto.UserId);
        if (user == null)
        {
            return Results.NotFound(new { message = "Kullanıcı bulunamadı." });
        }

        var pastTx = await dbContext.Transactions
            .Where(t => t.UserId == user.Id && t.Intent == "EXPENSE")
            .OrderByDescending(t => t.CreatedAt)
            .Take(50)
            .Select(t => new { t.MerchantOrTitle, t.Amount, t.Category, t.CreatedAt })
            .ToListAsync();

        var jsonStr = System.Text.Json.JsonSerializer.Serialize(pastTx);
        var response = await aiClient.DetectAnomaliesAsync(dto.UserId, jsonStr);

        if (!response.IsSuccessful)
        {
            return Results.BadRequest(new { message = "Anomali tespiti yapılamadı." });
        }

        using var doc = System.Text.Json.JsonDocument.Parse(response.AnomaliesJson);
        var addedCount = 0;

        foreach (var element in doc.RootElement.EnumerateArray())
        {
            var title = element.GetProperty("title").GetString() ?? "Anomali Uyarısı";
            var message = element.GetProperty("message").GetString() ?? "Olağandışı harcama hareketi saptandı.";
            var type = element.TryGetProperty("type", out var tProp) ? tProp.GetString() ?? "ANOMALY" : "ANOMALY";

            var notification = new Notification
            {
                UserId = user.Id,
                Title = title,
                Message = message,
                Type = type,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            dbContext.Notifications.Add(notification);
            addedCount++;
        }

        await dbContext.SaveChangesAsync();
        return Results.Ok(new { message = $"{addedCount} adet anomali bildirimi oluşturuldu." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Anomali tespiti hatası: {ex.Message}" });
    }
}).RequireRateLimiting("gemini-policy").AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.9: Kullanıcının Bildirimlerini Getirme
// ---------------------------------------------------------
app.MapGet("/api/notifications/{userId}", async (string userId, AppDbContext dbContext) =>
{
    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == userId || u.Id.ToString() == userId);
    if (user == null)
    {
        return Results.Ok(new { notifications = new List<object>(), unreadCount = 0 });
    }

    var list = await dbContext.Notifications
        .Where(n => n.UserId == user.Id)
        .OrderByDescending(n => n.CreatedAt)
        .Take(50)
        .Select(n => new
        {
            id = n.Id,
            type = n.Type,
            title = n.Title,
            message = n.Message,
            isRead = n.IsRead,
            createdAt = n.CreatedAt
        })
        .ToListAsync();

    var unreadCount = await dbContext.Notifications
        .CountAsync(n => n.UserId == user.Id && !n.IsRead);

    return Results.Ok(new { notifications = list, unreadCount });
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.10: Bildirimi Okundu İşaretleme
// ---------------------------------------------------------
app.MapPut("/api/notifications/{id}/read", async (Guid id, AppDbContext dbContext) =>
{
    try
    {
        var notification = await dbContext.Notifications.FindAsync(id);
        if (notification == null)
        {
            return Results.NotFound(new { message = "Bildirim bulunamadı." });
        }

        notification.IsRead = true;
        await dbContext.SaveChangesAsync();

        return Results.Ok(new { message = "Bildirim okundu olarak işaretlendi." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Hata: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.11: Tüm Bildirimleri Okundu İşaretleme
// ---------------------------------------------------------
app.MapPost("/api/notifications/read-all/{userId}", async (string userId, AppDbContext dbContext) =>
{
    try
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == userId || u.Id.ToString() == userId);
        if (user == null)
        {
            return Results.NotFound(new { message = "Kullanıcı bulunamadı." });
        }

        var unread = await dbContext.Notifications
            .Where(n => n.UserId == user.Id && !n.IsRead)
            .ToListAsync();

        foreach (var n in unread)
        {
            n.IsRead = true;
        }
        await dbContext.SaveChangesAsync();

        return Results.Ok(new { message = "Tüm bildirimler okundu olarak işaretlendi." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Hata: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.11B: 30 Günlük Cashflow Forecast (Nakit Akışı Tahmini)
// ---------------------------------------------------------
app.MapGet("/api/cashflow/forecast/{userId}", async (string userId, AppDbContext dbContext) =>
{
    try
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == userId || u.Id.ToString() == userId);
        if (user == null)
        {
            return Results.NotFound(new { message = "Kullanıcı bulunamadı." });
        }

        var now = DateTime.UtcNow;
        var thirtyDaysAgo = now.AddDays(-30);

        var pastTx = await dbContext.Transactions
            .Where(t => t.UserId == user.Id && t.CreatedAt >= thirtyDaysAgo)
            .ToListAsync();

        decimal totalIncome = pastTx.Where(t => t.Intent == "INCOME").Sum(t => t.Amount);
        decimal totalExpense = pastTx.Where(t => t.Intent == null || t.Intent == "EXPENSE").Sum(t => t.Amount);
        decimal currentBalance = totalIncome - totalExpense;

        decimal avgDailyIncome = totalIncome / 30m;
        decimal avgDailyExpense = totalExpense / 30m;
        decimal netDailyFlow = avgDailyIncome - avgDailyExpense;

        var recurring = await dbContext.RecurringTransactions
            .Where(r => r.UserId == user.Id && r.IsActive)
            .ToListAsync();

        var forecastList = new List<object>();
        decimal runningBalance = currentBalance;

        for (int i = 1; i <= 30; i++)
        {
            var forecastDate = now.AddDays(i);
            decimal dayRecurringBills = recurring
                .Where(r => r.NextDueDate.Date == forecastDate.Date)
                .Sum(r => r.Amount);

            runningBalance += netDailyFlow - dayRecurringBills;

            forecastList.Add(new
            {
                Day = i,
                DateStr = forecastDate.ToString("yyyy-MM-dd"),
                ProjectedBalance = Math.Round(runningBalance, 2),
                DailyNetFlow = Math.Round(netDailyFlow, 2),
                RecurringBills = Math.Round(dayRecurringBills, 2)
            });
        }

        return Results.Ok(new
        {
            CurrentBalance = currentBalance,
            AvgDailyIncome = Math.Round(avgDailyIncome, 2),
            AvgDailyExpense = Math.Round(avgDailyExpense, 2),
            NetDailyFlow = Math.Round(netDailyFlow, 2),
            Forecast = forecastList
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Forecast hatası: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.11C: Gamification & Finansal Sağlık Skoru (0-100)
// ---------------------------------------------------------
app.MapGet("/api/gamification/score/{userId}", async (string userId, AppDbContext dbContext) =>
{
    try
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == userId || u.Id.ToString() == userId);
        if (user == null)
        {
            return Results.NotFound(new { message = "Kullanıcı bulunamadı." });
        }

        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var txs = await dbContext.Transactions.Where(t => t.UserId == user.Id && t.CreatedAt >= startOfMonth).ToListAsync();

        decimal income = txs.Where(t => t.Intent == "INCOME").Sum(t => t.Amount);
        decimal expense = txs.Where(t => t.Intent == null || t.Intent == "EXPENSE").Sum(t => t.Amount);

        int score = 50; // Başlangıç taban puanı

        if (income > 0)
        {
            if (expense <= income)
            {
                decimal savingRatio = (income - expense) / income;
                score += (int)(savingRatio * 25m); // Tasarruf oranına göre +25 puana kadar
            }
            else
            {
                score -= 15; // Bütçe eksiye düşmüşse -15 puan
            }
        }

        // Bütçe limitlerine uyum
        var budgets = await dbContext.BudgetLimits.Where(b => b.UserId == user.Id).ToListAsync();
        if (budgets.Any())
        {
            bool allWithinLimits = budgets.All(b =>
            {
                var catSpent = txs.Where(t => t.Category.ToLower() == b.Category.ToLower() && (t.Intent == null || t.Intent == "EXPENSE")).Sum(t => t.Amount);
                return catSpent <= b.LimitAmount;
            });
            if (allWithinLimits) score += 15;
        }

        // Takip serisi (Streak)
        var trackingDays = txs.Select(t => t.CreatedAt.Date).Distinct().Count();
        int streakDays = Math.Min(trackingDays, 10);
        score += streakDays;

        score = Math.Clamp(score, 0, 100);

        var badges = new List<string>();
        if (score >= 80) badges.Add("🏆 Finansal Usta");
        if (score >= 60) badges.Add("🌟 Akıllı Birikimci");
        if (trackingDays >= 5) badges.Add("🔥 Takip Serisi Alevi");
        if (income > expense && income > 0) badges.Add("💰 Pozitif Bakiye Rozeti");

        return Results.Ok(new
        {
            HealthScore = score,
            StreakDays = trackingDays,
            StatusLevel = score >= 80 ? "Mükemmel" : score >= 60 ? "İyi" : score >= 40 ? "Orta" : "Dikkat Etmeli",
            Badges = badges
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Gamification hatası: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.12: Finansal Hedefleri Getirme
// ---------------------------------------------------------
app.MapGet("/api/goals/{userId}", async (string userId, AppDbContext dbContext) =>
{
    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == userId || u.Id.ToString() == userId);
    if (user == null)
    {
        return Results.Ok(new List<object>());
    }

    var list = await dbContext.Goals
        .Where(g => g.UserId == user.Id)
        .OrderByDescending(g => g.CreatedAt)
        .Select(g => new
        {
            id = g.Id,
            title = g.Title,
            targetAmount = g.TargetAmount,
            currentAmount = g.CurrentAmount,
            deadline = g.Deadline,
            category = g.Category,
            status = g.Status,
            createdAt = g.CreatedAt
        })
        .ToListAsync();

    return Results.Ok(list);
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.13: Yeni Finansal Hedef Ekleme
// ---------------------------------------------------------
app.MapPost("/api/goals", async (CreateGoalDto dto, AppDbContext dbContext) =>
{
    try
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == dto.UserId || u.Id.ToString() == dto.UserId);
        if (user == null)
        {
            return Results.NotFound(new { message = "Kullanıcı bulunamadı." });
        }

        var goal = new Goal
        {
            UserId = user.Id,
            Title = dto.Title,
            TargetAmount = dto.TargetAmount,
            CurrentAmount = dto.CurrentAmount,
            Deadline = dto.Deadline.ToUniversalTime(),
            Category = string.IsNullOrWhiteSpace(dto.Category) ? "Birikim" : dto.Category,
            Status = "IN_PROGRESS",
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Goals.Add(goal);
        await dbContext.SaveChangesAsync();

        return Results.Ok(new { message = "Finansal hedef oluşturuldu.", GoalId = goal.Id });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Hedef oluşturma hatası: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.14: Hedeften Para Ekleme (Deposit)
// ---------------------------------------------------------
app.MapPost("/api/goals/{id}/deposit", async (Guid id, DepositGoalDto dto, AppDbContext dbContext) =>
{
    try
    {
        var goal = await dbContext.Goals.FindAsync(id);
        if (goal == null)
        {
            return Results.NotFound(new { message = "Hedef bulunamadı." });
        }

        goal.CurrentAmount += dto.Amount;
        if (goal.CurrentAmount >= goal.TargetAmount)
        {
            goal.Status = "COMPLETED";
        }

        await dbContext.SaveChangesAsync();
        return Results.Ok(new { message = "Tasarruf miktarı hedefe eklendi.", goal.CurrentAmount, goal.Status });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Deposit hatası: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.15: Hedef Silme
// ---------------------------------------------------------
app.MapDelete("/api/goals/{id}", async (Guid id, AppDbContext dbContext) =>
{
    try
    {
        var goal = await dbContext.Goals.FindAsync(id);
        if (goal == null)
        {
            return Results.NotFound(new { message = "Hedef bulunamadı." });
        }

        dbContext.Goals.Remove(goal);
        await dbContext.SaveChangesAsync();

        return Results.Ok(new { message = "Finansal hedef silindi." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Silme hatası: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.15B: Hedef Güncelleme (Target/Deadline Update)
// ---------------------------------------------------------
app.MapPut("/api/goals/{id}", async (Guid id, UpdateGoalDto dto, AppDbContext dbContext) =>
{
    try
    {
        var goal = await dbContext.Goals.FindAsync(id);
        if (goal == null)
        {
            return Results.NotFound(new { message = "Hedef bulunamadı." });
        }

        if (!string.IsNullOrWhiteSpace(dto.Title)) goal.Title = dto.Title;
        if (dto.TargetAmount > 0) goal.TargetAmount = dto.TargetAmount;
        if (dto.Deadline.HasValue) goal.Deadline = dto.Deadline.Value.ToUniversalTime();
        if (!string.IsNullOrWhiteSpace(dto.Category)) goal.Category = dto.Category;

        if (goal.CurrentAmount >= goal.TargetAmount)
        {
            goal.Status = "COMPLETED";
        }
        else if (goal.Status == "COMPLETED" && goal.CurrentAmount < goal.TargetAmount)
        {
            goal.Status = "ACTIVE";
        }

        await dbContext.SaveChangesAsync();
        return Results.Ok(new { message = "Hedef başarıyla güncellendi.", goal });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Hedef güncelleme hatası: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.16: Gemini Yapay Zeka Hedef Projeksiyonu
// ---------------------------------------------------------
app.MapPost("/api/goals/{id}/ai-projection", async (Guid id, AppDbContext dbContext, IAiClientService aiClient) =>
{
    try
    {
        var goal = await dbContext.Goals.Include(g => g.User).FirstOrDefaultAsync(g => g.Id == id);
        if (goal == null)
        {
            return Results.NotFound(new { message = "Hedef bulunamadı." });
        }

        var result = await aiClient.CalculateGoalProjectionAsync(
            goal.User.ExternalUserId,
            goal.Title,
            goal.TargetAmount,
            goal.CurrentAmount,
            goal.Deadline.ToString("yyyy-MM-dd")
        );

        return Results.Ok(new
        {
            result.EstimatedCompletionDate,
            result.RecommendedMonthlySaving,
            result.AdviceText
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"AI Projeksiyon hatası: {ex.Message}" });
    }
}).RequireRateLimiting("gemini-policy").AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.17: Faturaları Getirme (Esnaf Paket)
// ---------------------------------------------------------
app.MapGet("/api/invoices/{userId}", async (string userId, AppDbContext dbContext) =>
{
    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == userId || u.Id.ToString() == userId);
    if (user == null)
    {
        return Results.Ok(new { invoices = new List<object>(), totalVat = 0, totalAmount = 0 });
    }

    var list = await dbContext.Invoices
        .Where(i => i.UserId == user.Id)
        .OrderByDescending(i => i.IssueDate)
        .Select(i => new
        {
            id = i.Id,
            clientName = i.ClientName,
            amountBeforeVat = i.AmountBeforeVat,
            vatRatePercent = i.VatRatePercent,
            vatAmount = i.VatAmount,
            totalAmount = i.TotalAmount,
            description = i.Description,
            isPaid = i.IsPaid,
            issueDate = i.IssueDate,
            dueDate = i.DueDate
        })
        .ToListAsync();

    var totalVat = list.Sum(i => i.vatAmount);
    var totalAmount = list.Sum(i => i.totalAmount);

    return Results.Ok(new { invoices = list, totalVat, totalAmount });
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.18: Fatura Ekleme
// ---------------------------------------------------------
app.MapPost("/api/invoices", async (CreateInvoiceDto dto, AppDbContext dbContext) =>
{
    try
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == dto.UserId || u.Id.ToString() == dto.UserId);
        if (user == null)
        {
            return Results.NotFound(new { message = "Kullanıcı bulunamadı." });
        }

        var vatAmount = dto.AmountBeforeVat * ((decimal)dto.VatRatePercent / 100m);
        var totalAmount = dto.AmountBeforeVat + vatAmount;

        var invoice = new Invoice
        {
            UserId = user.Id,
            ClientName = dto.ClientName,
            AmountBeforeVat = dto.AmountBeforeVat,
            VatRatePercent = dto.VatRatePercent,
            VatAmount = vatAmount,
            TotalAmount = totalAmount,
            Description = dto.Description,
            IsPaid = dto.IsPaid,
            IssueDate = dto.IssueDate.ToUniversalTime(),
            DueDate = dto.DueDate.ToUniversalTime()
        };

        dbContext.Invoices.Add(invoice);
        await dbContext.SaveChangesAsync();

        return Results.Ok(new { message = "Fatura kaydedildi.", InvoiceId = invoice.Id, VatAmount = vatAmount, TotalAmount = totalAmount });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Fatura kaydetme hatası: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 9.19: Fatura Silme
// ---------------------------------------------------------
app.MapDelete("/api/invoices/{id}", async (Guid id, AppDbContext dbContext) =>
{
    try
    {
        var invoice = await dbContext.Invoices.FindAsync(id);
        if (invoice == null)
        {
            return Results.NotFound(new { message = "Fatura bulunamadı." });
        }

        dbContext.Invoices.Remove(invoice);
        await dbContext.SaveChangesAsync();

        return Results.Ok(new { message = "Fatura kaydı silindi." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Silme hatası: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 10: İşlem Güncelleme (PUT)
// ---------------------------------------------------------
app.MapPut("/api/transactions/{id}", async (Guid id, UpdateTransactionDto dto, AppDbContext dbContext) =>
{
    try
    {
        var tx = await dbContext.Transactions.FindAsync(id);
        if (tx == null)
        {
            return Results.NotFound(new { message = "İşlem bulunamadı." });
        }

        tx.Amount = dto.Amount;
        tx.Category = dto.Category;
        tx.MerchantOrTitle = dto.MerchantOrTitle;
        tx.Intent = dto.Intent;
        tx.TransactionDate = dto.TransactionDate.ToUniversalTime();

        await dbContext.SaveChangesAsync();
        return Results.Ok(new { message = "İşlem başarıyla güncellendi." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"İşlem güncellenirken hata oluştu: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 11: İşlem Silme (DELETE)
// ---------------------------------------------------------
app.MapDelete("/api/transactions/{id}", async (Guid id, AppDbContext dbContext) =>
{
    try
    {
        var tx = await dbContext.Transactions.FindAsync(id);
        if (tx == null)
        {
            return Results.NotFound(new { message = "İşlem bulunamadı." });
        }

        dbContext.Transactions.Remove(tx);
        await dbContext.SaveChangesAsync();
        return Results.Ok(new { message = "İşlem başarıyla silindi." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"İşlem silinirken hata oluştu: {ex.Message}" });
    }
}).AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 12: Gemini AI Finansal Danışman Sohbet (Chat)
// ---------------------------------------------------------
app.MapPost("/api/advisor/chat", async (AdvisorChatRequestDto dto, IAiClientService aiClient) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(dto.UserId) || string.IsNullOrWhiteSpace(dto.Message))
        {
            return Results.BadRequest(new { message = "Kullanıcı ID ve mesaj zorunludur." });
        }

        var response = await aiClient.ChatWithAdvisorAsync(dto.UserId, dto.Message, dto.History, dto.ContextJson);
        return Results.Ok(new { reply = response.Reply });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Sohbet servisi hatası: {ex.Message}" });
    }
}).RequireRateLimiting("gemini-policy").AllowAnonymous();

app.MapPost("/api/chat", async (AdvisorChatRequestDto dto, IAiClientService aiClient) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(dto.UserId) || string.IsNullOrWhiteSpace(dto.Message))
        {
            return Results.BadRequest(new { message = "Kullanıcı ID ve mesaj zorunludur." });
        }

        var response = await aiClient.ChatWithAdvisorAsync(dto.UserId, dto.Message, dto.History, dto.ContextJson);
        return Results.Ok(new { reply = response.Reply });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Sohbet servisi hatası: {ex.Message}" });
    }
}).RequireRateLimiting("gemini-policy").AllowAnonymous();

// ---------------------------------------------------------
// ENDPOINT 13: Admin - Sistem İstatistikleri (Stats)
// ---------------------------------------------------------
app.MapGet("/api/admin/stats", async (AppDbContext dbContext) =>
{
    try
    {
        var totalUsers = await dbContext.Users.CountAsync();
        var totalTransactions = await dbContext.Transactions.CountAsync();
        
        var transactions = await dbContext.Transactions.ToListAsync();
        var totalVolume = transactions.Sum(t => t.Amount);
        
        var avgConfidence = transactions.Any() 
            ? transactions.Average(t => t.ConfidenceScore) * 100 
            : 100.0;

        return Results.Ok(new
        {
            TotalUsers = totalUsers,
            TotalTransactions = totalTransactions,
            TotalVolume = totalVolume,
            AverageConfidenceScore = Math.Round(avgConfidence, 1)
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"İstatistikler alınırken hata: {ex.Message}" });
    }
}).RequireAuthorization("AdminOnly");

// ---------------------------------------------------------
// ENDPOINT 14: Admin - Tüm Kullanıcıları Listele
// ---------------------------------------------------------
app.MapGet("/api/admin/users", async (AppDbContext dbContext) =>
{
    try
    {
        var users = await dbContext.Users
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.IsAdmin,
                u.CreatedAt,
                TransactionsCount = u.Transactions.Count,
                ActiveBudgetsCount = u.BudgetLimits.Count
            })
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        return Results.Ok(users);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Kullanıcı listesi alınırken hata: {ex.Message}" });
    }
}).RequireAuthorization("AdminOnly");

// ---------------------------------------------------------
// ENDPOINT 15: Admin - Kullanıcı Sil
// ---------------------------------------------------------
app.MapDelete("/api/admin/users/{id}", async (Guid id, AppDbContext dbContext) =>
{
    try
    {
        var user = await dbContext.Users.FindAsync(id);
        if (user == null)
        {
            return Results.NotFound(new { message = "Kullanıcı bulunamadı." });
        }

        dbContext.Users.Remove(user);
        await dbContext.SaveChangesAsync();

        return Results.Ok(new { message = "Kullanıcı ve ilişkili tüm verileri başarıyla silindi." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Kullanıcı silinirken hata: {ex.Message}" });
    }
}).RequireAuthorization("AdminOnly");

// ---------------------------------------------------------
// ENDPOINT 16: Admin - Yetki Değiştir (Toggle Admin)
// ---------------------------------------------------------
app.MapPost("/api/admin/users/{id}/toggle-admin", async (Guid id, AppDbContext dbContext) =>
{
    try
    {
        var user = await dbContext.Users.FindAsync(id);
        if (user == null)
        {
            return Results.NotFound(new { message = "Kullanıcı bulunamadı." });
        }

        user.IsAdmin = !user.IsAdmin;
        await dbContext.SaveChangesAsync();

        return Results.Ok(new { message = $"Kullanıcı rolü başarıyla {(user.IsAdmin ? "Yönetici" : "Üye")} yapıldı." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Rol değiştirilirken hata: {ex.Message}" });
    }
}).RequireAuthorization("AdminOnly");

// ---------------------------------------------------------
// ENDPOINT 17: Admin - Yeni Kullanıcı Oluştur (Create User)
// ---------------------------------------------------------
app.MapPost("/api/admin/users", async (CreateAdminUserDto dto, AppDbContext dbContext) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password) || string.IsNullOrWhiteSpace(dto.Name))
        {
            return Results.BadRequest(new { message = "İsim, E-posta ve Parola alanları zorunludur." });
        }

        var existing = await dbContext.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower());
        if (existing)
        {
            return Results.BadRequest(new { message = "Bu e-posta adresi zaten kayıtlı." });
        }

        var newUser = new User
        {
            ExternalUserId = dto.Email.ToLower(),
            Email = dto.Email.ToLower(),
            Name = dto.Name,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            IsAdmin = dto.IsAdmin,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Users.Add(newUser);
        await dbContext.SaveChangesAsync();

        return Results.Ok(new { message = "Yeni kullanıcı başarıyla oluşturuldu.", user = newUser });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Kullanıcı oluşturulurken hata: {ex.Message}" });
    }
}).RequireAuthorization("AdminOnly");

// ---------------------------------------------------------
// ENDPOINT 18: Admin - Kullanıcı Güncelle (Update User)
// ---------------------------------------------------------
app.MapPut("/api/admin/users/{id}", async (Guid id, UpdateAdminUserDto dto, AppDbContext dbContext) =>
{
    try
    {
        var user = await dbContext.Users.FindAsync(id);
        if (user == null)
        {
            return Results.NotFound(new { message = "Kullanıcı bulunamadı." });
        }

        if (!string.IsNullOrWhiteSpace(dto.Name)) user.Name = dto.Name;
        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            user.Email = dto.Email.ToLower();
            user.ExternalUserId = dto.Email.ToLower();
        }
        user.IsAdmin = dto.IsAdmin;

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        }

        await dbContext.SaveChangesAsync();
        return Results.Ok(new { message = "Kullanıcı bilgileri başarıyla güncellendi." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = $"Kullanıcı güncellenirken hata: {ex.Message}" });
    }
}).RequireAuthorization("AdminOnly");

// Uygulama başlarken varsayılan admin@finai.com kullanıcısını otomatik oluştur ve yönetici yap
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.ExecuteSqlRaw(@"
            ALTER TABLE ""Users"" ADD COLUMN IF NOT EXISTS ""ResetToken"" text;
            ALTER TABLE ""Users"" ADD COLUMN IF NOT EXISTS ""ResetTokenExpiresAt"" timestamp with time zone;
        ");
    }
    catch { }

    var adminUser = db.Users.FirstOrDefault(u => u.Email.ToLower() == "admin@finai.com");
    if (adminUser == null)
    {
        adminUser = new User
        {
            ExternalUserId = "admin@finai.com",
            Email = "admin@finai.com",
            Name = "Sistem Yöneticisi",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            IsAdmin = true
        };
        db.Users.Add(adminUser);
        db.SaveChanges();
    }
    else if (!adminUser.IsAdmin)
    {
        adminUser.IsAdmin = true;
        db.SaveChanges();
    }
}

app.Run();

// Token Üretim Yardımcısı
static (string accessToken, RefreshToken refreshToken) GenerateTokenPair(User user, IConfiguration config)
{
    var tokenHandler = new JwtSecurityTokenHandler();
    var key = Encoding.UTF8.GetBytes(config["Jwt:Key"]!);
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.ExternalUserId),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.IsAdmin ? "Admin" : "User")
        }),
        Expires = DateTime.UtcNow.AddMinutes(15), // Short-lived Access Token (15 dk)
        Issuer = config["Jwt:Issuer"],
        Audience = config["Jwt:Audience"],
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
    };

    var token = tokenHandler.CreateToken(tokenDescriptor);
    var jwtString = tokenHandler.WriteToken(token);

    var refreshToken = new RefreshToken
    {
        UserId = user.Id,
        Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
        ExpiresAt = DateTime.UtcNow.AddDays(7),
        CreatedAt = DateTime.UtcNow
    };

    return (jwtString, refreshToken);
}

// Tarih Filtresi Yardımcısı
static IQueryable<Transaction> ApplyDateFilter(IQueryable<Transaction> query, string? range)
{
    var now = DateTime.UtcNow;
    return range?.ToLower() switch
    {
        "thismonth" => query.Where(t => t.CreatedAt >= new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc)),
        "lastmonth" => query.Where(t => t.CreatedAt >= new DateTime(now.AddMonths(-1).Year, now.AddMonths(-1).Month, 1, 0, 0, 0, DateTimeKind.Utc) &&
                                        t.CreatedAt < new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc)),
        "last30" => query.Where(t => t.CreatedAt >= now.AddDays(-30)),
        "last90" => query.Where(t => t.CreatedAt >= now.AddDays(-90)),
        "yearly" => query.Where(t => t.CreatedAt >= new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc)),
        _ => query
    };
}

// Bütçe Limiti Kontrolü ve Bildirim Üretme Yardımcısı
static async Task CheckAndNotifyBudgetLimits(Guid userId, string category, AppDbContext dbContext)
{
    if (string.IsNullOrWhiteSpace(category)) return;

    var budget = await dbContext.BudgetLimits.FirstOrDefaultAsync(b => b.UserId == userId && b.Category.ToLower() == category.ToLower());
    if (budget == null) return;

    var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
    var spent = await dbContext.Transactions
        .Where(t => t.UserId == userId && t.Category.ToLower() == category.ToLower() && t.CreatedAt >= startOfMonth && (t.Intent == null || t.Intent == "EXPENSE"))
        .SumAsync(t => t.Amount);

    if (spent >= budget.LimitAmount * 0.8m)
    {
        var isOver = spent >= budget.LimitAmount;
        var today = DateTime.UtcNow.Date;
        var existsToday = await dbContext.Notifications.AnyAsync(n =>
            n.UserId == userId &&
            n.Type == "BUDGET_WARNING" &&
            n.Title.Contains(category) &&
            n.CreatedAt >= today);

        if (!existsToday)
        {
            var notification = new Notification
            {
                UserId = userId,
                Type = "BUDGET_WARNING",
                Title = isOver ? $"[UYARI] {category} Bütçe Aşımı!" : $"[UYARI] {category} Bütçe Limiti Uyarısı",
                Message = isOver
                    ? $"{category} aylık bütçe limitiniz aşıldı! Harcama: {spent:N0} TL / Limit: {budget.LimitAmount:N0} TL"
                    : $"{category} aylık bütçenizin %80'ine ulaştınız. Harcama: {spent:N0} TL / Limit: {budget.LimitAmount:N0} TL",
                CreatedAt = DateTime.UtcNow
            };
            dbContext.Notifications.Add(notification);
            await dbContext.SaveChangesAsync();
        }
    }
}

// DTO Sınıfları
public record RegisterDto(string Name, string Email, string Password);
public record LoginDto(string Email, string Password);
public record GoogleLoginDto(string IdToken, bool AllowRegister = false);
public record RefreshTokenRequestDto(string RefreshToken);
public record RevokeTokenRequestDto(string RefreshToken);
public record ConfirmReceiptDto(decimal Amount, string Category, string MerchantName, DateTime TransactionDate);
public record DetectRecurringDto(string UserId);
public record DetectAnomaliesDto(string UserId);
public record CreateGoalDto(string UserId, string Title, decimal TargetAmount, decimal CurrentAmount, DateTime Deadline, string Category);
public record DepositGoalDto(decimal Amount);
public record CreateInvoiceDto(string UserId, string ClientName, decimal AmountBeforeVat, int VatRatePercent, string Description, bool IsPaid, DateTime IssueDate, DateTime DueDate);
public record RecurringTransactionDto(string UserId, string MerchantName, decimal Amount, string Category, string Frequency, DateTime NextDueDate, bool IsActive);
public record TransactionRequestDto(string UserId, string InputText);
public record BudgetLimitRequestDto(string UserId, string Category, decimal LimitAmount);
public record UpdateTransactionDto(decimal Amount, string Category, string MerchantOrTitle, string Intent, DateTime TransactionDate);
public record AdvisorChatRequestDto(string UserId, string Message, List<ChatMessageDto> History, string ContextJson);
public record CreateAdminUserDto(string Name, string Email, string Password, bool IsAdmin);
public record UpdateAdminUserDto(string Name, string Email, string? Password, bool IsAdmin);
public record ForgotPasswordDto(string Email);
public record ResetPasswordDto(string Email, string NewPassword, string? Token);
public record UpdateGoalDto(string? Title, decimal TargetAmount, DateTime? Deadline, string? Category);