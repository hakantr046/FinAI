using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FinAI.Backend.Data;
using FinAI.Backend.Dtos;
using FinAI.Backend.Entities;
using FinAI.Backend.Extensions;
using FinAI.Backend.Services;
using Microsoft.EntityFrameworkCore;
using Google.Apis.Auth;

namespace FinAI.Backend.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
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
}).RequireRateLimiting("auth-policy").AllowAnonymous();

// ---------------------------------------------------------
// AUTH ENDPOINT 2: GİRİŞ YAP (LOGIN & JWT + REFRESH TOKEN)
// ---------------------------------------------------------
app.MapPost("/api/auth/login", async (LoginDto dto, AppDbContext dbContext, ITokenService tokenService) =>
{
    try
    {
        var normalizedEmail = dto.Email.Trim().ToLower();
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return Results.BadRequest(new { message = "E-posta veya şifre hatalı." });
        }

        var (accessToken, refreshToken) = tokenService.GenerateTokenPair(user);
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
}).RequireRateLimiting("auth-policy").AllowAnonymous();

// ---------------------------------------------------------
// AUTH ENDPOINT 2.1: GOOGLE İLE GİRİŞ (SIGN IN WITH GOOGLE)
// ---------------------------------------------------------
app.MapPost("/api/auth/google", async (GoogleLoginDto dto, AppDbContext dbContext, IConfiguration config, ITokenService tokenService) =>
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

        var (accessToken, refreshToken) = tokenService.GenerateTokenPair(user);
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
app.MapPost("/api/auth/refresh", async (RefreshTokenRequestDto dto, AppDbContext dbContext, ITokenService tokenService) =>
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
        var (newAccessToken, newRefreshToken) = tokenService.GenerateTokenPair(existingToken.User);
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
app.MapPost("/api/auth/forgot-password", async (ForgotPasswordDto dto, AppDbContext dbContext, IEmailService emailService, IConfiguration config) =>
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

        var frontendBaseUrl = config["Frontend:BaseUrl"] ?? "http://localhost:3000";
        var resetLink = $"{frontendBaseUrl}/reset-password?email={Uri.EscapeDataString(user.Email)}&token={resetToken}";

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
    }
}
