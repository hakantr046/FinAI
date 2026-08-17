using System.ComponentModel.DataAnnotations;

namespace FinAI.Backend.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string ExternalUserId { get; set; } = string.Empty; // username / unique id

    [Required]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public bool IsAdmin { get; set; } = false;

    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public ICollection<BudgetLimit> BudgetLimits { get; set; } = new List<BudgetLimit>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Receipt> Receipts { get; set; } = new List<Receipt>();
    public ICollection<RecurringTransaction> RecurringTransactions { get; set; } = new List<RecurringTransaction>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<Goal> Goals { get; set; } = new List<Goal>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}