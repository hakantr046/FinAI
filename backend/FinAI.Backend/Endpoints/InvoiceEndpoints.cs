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

public static class InvoiceEndpoints
{
    public static void MapInvoiceEndpoints(this WebApplication app)
    {
app.MapGet("/api/invoices/{userId}", async (ClaimsPrincipal principal, AppDbContext dbContext) =>
{
    var callerId = principal.GetUserId();
    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == callerId || u.Id.ToString() == callerId);
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
}).RequireAuthorization();

// ---------------------------------------------------------
// ENDPOINT 9.18: Fatura Ekleme
// ---------------------------------------------------------
app.MapPost("/api/invoices", async (CreateInvoiceDto dto, ClaimsPrincipal principal, AppDbContext dbContext) =>
{
    try
    {
        var callerId = principal.GetUserId();
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == callerId || u.Id.ToString() == callerId);
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
}).RequireAuthorization();

// ---------------------------------------------------------
// ENDPOINT 9.19: Fatura Silme
// ---------------------------------------------------------
app.MapDelete("/api/invoices/{id}", async (Guid id, ClaimsPrincipal principal, AppDbContext dbContext) =>
{
    try
    {
        var invoice = await dbContext.Invoices.FindAsync(id);
        if (invoice == null)
        {
            return Results.NotFound(new { message = "Fatura bulunamadı." });
        }

        var callerId = principal.GetUserId();
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == callerId || u.Id.ToString() == callerId);
        if (user == null || invoice.UserId != user.Id)
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
}).RequireAuthorization();
    }
}
