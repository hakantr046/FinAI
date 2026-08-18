using FinAI.Backend.Data;
using FinAI.Backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinAI.Backend.Services;

public class BudgetAlertService : IBudgetAlertService
{
    private readonly AppDbContext dbContext;

    public BudgetAlertService(AppDbContext dbContext)
    {
        this.dbContext = dbContext;
    }

    public async Task CheckAndNotifyAsync(Guid userId, string category)
    {
    if (string.IsNullOrWhiteSpace(category)) return;

    var budget = await dbContext.BudgetLimits.FirstOrDefaultAsync(b => b.UserId == userId && b.Category.ToLower() == category.ToLower());
    if (budget == null) return;

    var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
    var spent = await dbContext.Transactions
        .Where(t => t.UserId == userId && t.Category.ToLower() == category.ToLower() && t.CreatedAt >= startOfMonth && (t.Intent == null || t.Intent == "EXPENSE"))
        .SumAsync(t => t.Amount);

    if (spent >= budget.LimitAmount * 0.8m)
    {
        var isOver = spent >= budget.LimitAmount;
        var today = DateTime.UtcNow.Date;
        var existsToday = await dbContext.Notifications.AnyAsync(n =>
            n.UserId == userId &&
            n.Type == "BUDGET_WARNING" &&
            n.Title.Contains(category) &&
            n.CreatedAt >= today);

        if (!existsToday)
        {
            var notification = new Notification
            {
                UserId = userId,
                Type = "BUDGET_WARNING",
                Title = isOver ? $"[UYARI] {category} Bütçe Aşımı!" : $"[UYARI] {category} Bütçe Limiti Uyarısı",
                Message = isOver
                    ? $"{category} aylık bütçe limitiniz aşıldı! Harcama: {spent:N0} TL / Limit: {budget.LimitAmount:N0} TL"
                    : $"{category} aylık bütçenizin %80'ine ulaştınız. Harcama: {spent:N0} TL / Limit: {budget.LimitAmount:N0} TL",
                CreatedAt = DateTime.UtcNow
            };
            dbContext.Notifications.Add(notification);
            await dbContext.SaveChangesAsync();
        }
    }
    }
}
