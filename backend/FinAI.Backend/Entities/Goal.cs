using System.ComponentModel.DataAnnotations;

namespace FinAI.Backend.Entities;

public class Goal
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [Required]
    public string Title { get; set; } = string.Empty;

    public decimal TargetAmount { get; set; }

    public decimal CurrentAmount { get; set; }

    public DateTime Deadline { get; set; } = DateTime.UtcNow.AddYears(1);

    public string Category { get; set; } = "Birikim"; // Birikim, Tatil, Ev/Araba, Acil Durum, Diğer

    public string Status { get; set; } = "IN_PROGRESS"; // IN_PROGRESS, COMPLETED, PAUSED

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
