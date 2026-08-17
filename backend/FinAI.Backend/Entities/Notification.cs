using System.ComponentModel.DataAnnotations;

namespace FinAI.Backend.Entities;

public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    public string Type { get; set; } = "ANOMALY"; // ANOMALY, BUDGET_WARNING, SYSTEM

    [Required]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
