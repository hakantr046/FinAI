using System.ComponentModel.DataAnnotations;

namespace FinAI.Backend.Entities;

public class RecurringTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [Required]
    public string MerchantName { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string Category { get; set; } = "Diğer";

    public string Frequency { get; set; } = "Monthly"; // Monthly, Weekly, Yearly

    public DateTime NextDueDate { get; set; } = DateTime.UtcNow.AddMonths(1);

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
