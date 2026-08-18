using FinAI.Backend.Entities;

namespace FinAI.Backend.Extensions;

public static class TransactionQueryExtensions
{
    public static IQueryable<Transaction> ApplyDateFilter(this IQueryable<Transaction> query, string? range)
    {
    var now = DateTime.UtcNow;
    return range?.ToLower() switch
    {
        "thismonth" => query.Where(t => t.CreatedAt >= new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc)),
        "lastmonth" => query.Where(t => t.CreatedAt >= new DateTime(now.AddMonths(-1).Year, now.AddMonths(-1).Month, 1, 0, 0, 0, DateTimeKind.Utc) &&
                                        t.CreatedAt < new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc)),
        "last30" => query.Where(t => t.CreatedAt >= now.AddDays(-30)),
        "last90" => query.Where(t => t.CreatedAt >= now.AddDays(-90)),
        "yearly" => query.Where(t => t.CreatedAt >= new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc)),
        _ => query
    };
    }
}
