using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FinAI.Backend.Data;
using FinAI.Backend.Dtos;
using FinAI.Backend.Entities;
using FinAI.Backend.Extensions;
using FinAI.Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace FinAI.Backend.Endpoints;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this WebApplication app)
    {
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
    }
}
