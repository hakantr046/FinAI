namespace FinAI.Backend.Services;

public interface IBudgetAlertService
{
    Task CheckAndNotifyAsync(Guid userId, string category);
}
