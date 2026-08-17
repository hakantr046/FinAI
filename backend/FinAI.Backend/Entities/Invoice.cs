using System.ComponentModel.DataAnnotations;

namespace FinAI.Backend.Entities;

public class Invoice
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [Required]
    public string ClientName { get; set; } = string.Empty;

    public decimal AmountBeforeVat { get; set; }

    public int VatRatePercent { get; set; } = 20; // 1, 10, 20

    public decimal VatAmount { get; set; }

    public decimal TotalAmount { get; set; }

    public string Description { get; set; } = string.Empty;

    public bool IsPaid { get; set; } = false;

    public DateTime IssueDate { get; set; } = DateTime.UtcNow;

    public DateTime DueDate { get; set; } = DateTime.UtcNow.AddDays(30);

    public User User { get; set; } = null!;
}
