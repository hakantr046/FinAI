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

public static class ReceiptEndpoints
{
    public static void MapReceiptEndpoints(this WebApplication app)
    {
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
    }
}
