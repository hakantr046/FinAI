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

public static class AnalyticsEndpoints
{
    public static void MapAnalyticsEndpoints(this WebApplication app)
    {
app.MapGet("/api/insights/{userId}", async (string userId, ClaimsPrincipal principal, IAiClientService aiClient, AppDbContext dbContext) =>
{
    var callerId = principal.GetUserId();
    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == callerId);
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

    var insight = await aiClient.GetFinancialInsightAsync(callerId!, summaryJson);

    return Results.Ok(new
    {
        InsightText = insight.InsightText,
        RiskLevel = insight.RiskLevel,
        Recommendations = insight.Recommendations
    });
}).RequireRateLimiting("gemini-policy").RequireAuthorization();
app.MapGet("/api/cashflow/forecast/{userId}", async (string userId, ClaimsPrincipal principal, AppDbContext dbContext) =>
{
    try
    {
        var callerId = principal.GetUserId();
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == callerId || u.Id.ToString() == callerId);
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
}).RequireAuthorization();

// ---------------------------------------------------------
// ENDPOINT 9.11C: Gamification & Finansal Sağlık Skoru (0-100)
// ---------------------------------------------------------
app.MapGet("/api/gamification/score/{userId}", async (string userId, ClaimsPrincipal principal, AppDbContext dbContext) =>
{
    try
    {
        var callerId = principal.GetUserId();
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalUserId == callerId || u.Id.ToString() == callerId);
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
}).RequireAuthorization();
    }
}
