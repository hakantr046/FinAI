using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FinAI.Backend.Data;
using FinAI.Backend.Dtos;
using FinAI.Backend.Entities;
using FinAI.Backend.Extensions;
using FinAI.Backend.Services;
using Microsoft.EntityFrameworkCore;
using System.Data;
using ExcelDataReader;

namespace FinAI.Backend.Endpoints;

public static class TransactionEndpoints
{
    public static void MapTransactionEndpoints(this WebApplication app)
    {
app.MapPost("/api/parse-transaction", async (TransactionRequestDto dto, IAiClientService aiClient, IPiiMaskingService piiMasker, AppDbContext dbContext, IBudgetAlertService budgetAlerts) =>
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
    await budgetAlerts.CheckAndNotifyAsync(user.Id, transaction.Category);

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
    query = query.ApplyDateFilter(range);

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
    query = query.ApplyDateFilter(range);
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
    }
}
