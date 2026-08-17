using System.ComponentModel.DataAnnotations;

namespace FinAI.Backend.Entities;

public class BudgetLimit
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [Required]
    public string Category { get; set; } = string.Empty;

    public decimal LimitAmount { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Property
    public User User { get; set; } = null!;
}
