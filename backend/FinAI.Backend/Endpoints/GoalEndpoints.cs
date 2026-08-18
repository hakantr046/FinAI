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

public static class GoalEndpoints
{
    public static void MapGoalEndpoints(this WebApplication app)
    {
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
    }
}
