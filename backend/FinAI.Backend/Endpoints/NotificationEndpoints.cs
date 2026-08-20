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

public static class NotificationEndpoints
{
    public static void MapNotificationEndpoints(this WebApplication app)
    {
app.MapPost("/api/notifications/detect-anomalies", async (DetectAnomaliesDto dto, ClaimsPrincipal principal, AppDbContext dbContext, IAiClientService aiClient) =>
{
    try
    {
        var callerId = principal.GetUserId();
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == callerId);
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
        var response = await aiClient.DetectAnomaliesAsync(callerId!, jsonStr);

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
}).RequireRateLimiting("gemini-policy").RequireAuthorization();

// ---------------------------------------------------------
// ENDPOINT 9.9: Kullanıcının Bildirimlerini Getirme
// ---------------------------------------------------------
app.MapGet("/api/notifications/{userId}", async (string userId, ClaimsPrincipal principal, AppDbContext dbContext) =>
{
    var callerId = principal.GetUserId();
    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == callerId || u.Id.ToString() == callerId);
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
}).RequireAuthorization();

// ---------------------------------------------------------
// ENDPOINT 9.10: Bildirimi Okundu İşaretleme
// ---------------------------------------------------------
app.MapPut("/api/notifications/{id}/read", async (Guid id, ClaimsPrincipal principal, AppDbContext dbContext) =>
{
    try
    {
        var callerId = principal.GetUserId();
        var caller = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == callerId);
        if (caller == null)
        {
            return Results.NotFound(new { message = "Bildirim bulunamadı." });
        }

        var notification = await dbContext.Notifications.FindAsync(id);
        if (notification == null || notification.UserId != caller.Id)
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
}).RequireAuthorization();

// ---------------------------------------------------------
// ENDPOINT 9.11: Tüm Bildirimleri Okundu İşaretleme
// ---------------------------------------------------------
app.MapPost("/api/notifications/read-all/{userId}", async (string userId, ClaimsPrincipal principal, AppDbContext dbContext) =>
{
    try
    {
        var callerId = principal.GetUserId();
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == callerId || u.Id.ToString() == callerId);
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
}).RequireAuthorization();
    }
}
