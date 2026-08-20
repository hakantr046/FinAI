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

public static class RecurringEndpoints
{
    public static void MapRecurringEndpoints(this WebApplication app)
    {
app.MapPost("/api/recurring-transactions/detect", async (DetectRecurringDto dto, ClaimsPrincipal principal, AppDbContext dbContext, IAiClientService aiClient) =>
{
    try
    {
        var userId = principal.GetUserId();
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == userId);
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
        var response = await aiClient.DetectRecurringPaymentsAsync(userId, jsonStr);

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
}).RequireRateLimiting("gemini-policy").RequireAuthorization();

// ---------------------------------------------------------
// ENDPOINT 9.5: Kullanıcının Tekrarlayan Ödemelerini Getirme
// ---------------------------------------------------------
app.MapGet("/api/recurring-transactions/{userId}", async (ClaimsPrincipal principal, AppDbContext dbContext) =>
{
    var authUserId = principal.GetUserId();
    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == authUserId || u.Id.ToString() == authUserId);
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
}).RequireAuthorization();

// ---------------------------------------------------------
// ENDPOINT 9.6: Tekrarlayan Ödeme Ekleme veya Güncelleme
// ---------------------------------------------------------
app.MapPost("/api/recurring-transactions", async (RecurringTransactionDto dto, ClaimsPrincipal principal, AppDbContext dbContext) =>
{
    try
    {
        var authUserId = principal.GetUserId();
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == authUserId || u.Id.ToString() == authUserId);
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
}).RequireAuthorization();

// ---------------------------------------------------------
// ENDPOINT 9.7: Tekrarlayan Ödeme Silme
// ---------------------------------------------------------
app.MapDelete("/api/recurring-transactions/{id}", async (Guid id, ClaimsPrincipal principal, AppDbContext dbContext) =>
{
    try
    {
        var rt = await dbContext.RecurringTransactions.FindAsync(id);
        if (rt == null)
        {
            return Results.NotFound(new { message = "Kayıt bulunamadı." });
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == principal.GetUserId());
        if (user == null || rt.UserId != user.Id)
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
}).RequireAuthorization();
    }
}
