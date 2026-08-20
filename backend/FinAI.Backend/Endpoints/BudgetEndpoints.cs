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

public static class BudgetEndpoints
{
    public static void MapBudgetEndpoints(this WebApplication app)
    {
app.MapGet("/api/budgets/summary/{userId}", async (ClaimsPrincipal principal, AppDbContext dbContext) =>
{
    try
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == principal.GetUserId());
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
}).RequireAuthorization();

// ---------------------------------------------------------
// ENDPOINT 7: Bütçe Limiti Ekleme veya Güncelleme (Upsert)
// ---------------------------------------------------------
app.MapPost("/api/budgets", async (BudgetLimitRequestDto dto, ClaimsPrincipal principal, AppDbContext dbContext) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(dto.Category) || dto.LimitAmount <= 0)
        {
            return Results.BadRequest(new { message = "Geçersiz bütçe bilgileri." });
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == principal.GetUserId());
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
}).RequireAuthorization();

// ---------------------------------------------------------
// ENDPOINT 8: Bütçe Limiti Silme
// ---------------------------------------------------------
app.MapDelete("/api/budgets/{budgetId}", async (Guid budgetId, ClaimsPrincipal principal, AppDbContext dbContext) =>
{
    try
    {
        var budget = await dbContext.BudgetLimits.FindAsync(budgetId);
        if (budget == null)
        {
            return Results.NotFound(new { message = "Bütçe limiti bulunamadı." });
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == principal.GetUserId());
        if (user == null || budget.UserId != user.Id)
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
}).RequireAuthorization();
    }
}
