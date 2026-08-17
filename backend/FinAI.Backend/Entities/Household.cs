using System.ComponentModel.DataAnnotations;

namespace FinAI.Backend.Entities;

public class Household
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string Name { get; set; } = string.Empty;

    public Guid OwnerUserId { get; set; }

    public string InviteCode { get; set; } = Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();

    public decimal MonthlyBudgetPool { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
