using FinAI.Backend.Services;

namespace FinAI.Backend.Dtos;

// İstek gövdesi (request body) veri transfer nesneleri
public record RegisterDto(string Name, string Email, string Password);
public record LoginDto(string Email, string Password);
public record GoogleLoginDto(string IdToken, bool AllowRegister = false);
public record RefreshTokenRequestDto(string RefreshToken);
public record RevokeTokenRequestDto(string RefreshToken);
public record ConfirmReceiptDto(decimal Amount, string Category, string MerchantName, DateTime TransactionDate);
public record DetectRecurringDto(string UserId);
public record DetectAnomaliesDto(string UserId);
public record CreateGoalDto(string UserId, string Title, decimal TargetAmount, decimal CurrentAmount, DateTime Deadline, string Category);
public record DepositGoalDto(decimal Amount);
public record CreateInvoiceDto(string UserId, string ClientName, decimal AmountBeforeVat, int VatRatePercent, string Description, bool IsPaid, DateTime IssueDate, DateTime DueDate);
public record RecurringTransactionDto(string UserId, string MerchantName, decimal Amount, string Category, string Frequency, DateTime NextDueDate, bool IsActive);
public record TransactionRequestDto(string UserId, string InputText);
public record BudgetLimitRequestDto(string UserId, string Category, decimal LimitAmount);
public record UpdateTransactionDto(decimal Amount, string Category, string MerchantOrTitle, string Intent, DateTime TransactionDate);
public record AdvisorChatRequestDto(string UserId, string Message, List<ChatMessageDto> History, string ContextJson);
public record CreateAdminUserDto(string Name, string Email, string Password, bool IsAdmin);
public record UpdateAdminUserDto(string Name, string Email, string? Password, bool IsAdmin);
public record ForgotPasswordDto(string Email);
public record ResetPasswordDto(string Email, string NewPassword, string? Token);
public record UpdateGoalDto(string? Title, decimal TargetAmount, DateTime? Deadline, string? Category);
