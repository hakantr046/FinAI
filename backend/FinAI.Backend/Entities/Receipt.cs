using System.ComponentModel.DataAnnotations;

namespace FinAI.Backend.Entities;

public class Receipt
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    public string ImageUrl { get; set; } = string.Empty;

    public string MerchantName { get; set; } = string.Empty;

    public decimal TotalAmount { get; set; }

    public string Category { get; set; } = "Diğer";

    public string ExtractedDataJson { get; set; } = "{}";

    public Guid? TransactionId { get; set; }

    public string Status { get; set; } = "PENDING"; // PENDING, SAVED, REJECTED

    public double ConfidenceScore { get; set; } = 0.9;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
