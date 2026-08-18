using Grpc.Net.Client;
using Finai;

namespace FinAI.Backend.Services;

public record ChatMessageDto(string Role, string Content);

public interface IAiClientService
{
    Task<TransactionResponse> ProcessTransactionAsync(string userId, string inputText);
    Task<InsightResponse> GetFinancialInsightAsync(string userId, string summaryJson);
    Task<ChatResponse> ChatWithAdvisorAsync(string userId, string message, List<ChatMessageDto> history, string contextJson);
    Task<ReceiptResponse> ExtractReceiptDataAsync(string userId, byte[] imageBytes, string mimeType);
    Task<RecurringPaymentsResponse> DetectRecurringPaymentsAsync(string userId, string transactionsJson);
    Task<AnomalyResponse> DetectAnomaliesAsync(string userId, string transactionsJson);
    Task<GoalProjectionResponse> CalculateGoalProjectionAsync(string userId, string goalTitle, decimal targetAmount, decimal currentAmount, string deadlineDate);
}

public class AiClientService : IAiClientService
{
    private readonly string _grpcAddress;

    public AiClientService(IConfiguration config)
    {
        _grpcAddress = config["AiService:GrpcAddress"] ?? "http://localhost:50051";
    }

    public async Task<TransactionResponse> ProcessTransactionAsync(string userId, string inputText)
    {
        using var channel = GrpcChannel.ForAddress(_grpcAddress);
        var client = new FinAiService.FinAiServiceClient(channel);

        var request = new TransactionRequest
        {
            UserId = userId,
            InputText = inputText
        };

        return await client.ParseTransactionAsync(request);
    }

    public async Task<InsightResponse> GetFinancialInsightAsync(string userId, string summaryJson)
    {
        using var channel = GrpcChannel.ForAddress(_grpcAddress);
        var client = new FinAiService.FinAiServiceClient(channel);

        var request = new InsightRequest
        {
            UserId = userId,
            TransactionsSummaryJson = summaryJson
        };

        return await client.GenerateFinancialInsightAsync(request);
    }

    public async Task<ChatResponse> ChatWithAdvisorAsync(string userId, string message, List<ChatMessageDto> history, string contextJson)
    {
        using var channel = GrpcChannel.ForAddress(_grpcAddress);
        var client = new FinAiService.FinAiServiceClient(channel);

        var request = new ChatRequest
        {
            UserId = userId,
            Message = message,
            ContextJson = contextJson
        };

        foreach (var msg in history)
        {
            request.History.Add(new ChatMessage
            {
                Role = msg.Role,
                Content = msg.Content
            });
        }

        return await client.ChatWithAdvisorAsync(request);
    }

    public async Task<ReceiptResponse> ExtractReceiptDataAsync(string userId, byte[] imageBytes, string mimeType)
    {
        using var channel = GrpcChannel.ForAddress(_grpcAddress);
        var client = new FinAiService.FinAiServiceClient(channel);

        var request = new ReceiptRequest
        {
            UserId = userId,
            ImageBytes = Google.Protobuf.ByteString.CopyFrom(imageBytes),
            MimeType = mimeType
        };

        return await client.ExtractReceiptDataAsync(request);
    }

    public async Task<RecurringPaymentsResponse> DetectRecurringPaymentsAsync(string userId, string transactionsJson)
    {
        using var channel = GrpcChannel.ForAddress(_grpcAddress);
        var client = new FinAiService.FinAiServiceClient(channel);

        var request = new RecurringPaymentsRequest
        {
            UserId = userId,
            TransactionsJson = transactionsJson
        };

        return await client.DetectRecurringPaymentsAsync(request);
    }

    public async Task<AnomalyResponse> DetectAnomaliesAsync(string userId, string transactionsJson)
    {
        using var channel = GrpcChannel.ForAddress(_grpcAddress);
        var client = new FinAiService.FinAiServiceClient(channel);

        var request = new AnomalyRequest
        {
            UserId = userId,
            TransactionsJson = transactionsJson
        };

        return await client.DetectAnomaliesAsync(request);
    }

    public async Task<GoalProjectionResponse> CalculateGoalProjectionAsync(string userId, string goalTitle, decimal targetAmount, decimal currentAmount, string deadlineDate)
    {
        using var channel = GrpcChannel.ForAddress(_grpcAddress);
        var client = new FinAiService.FinAiServiceClient(channel);

        var request = new GoalProjectionRequest
        {
            UserId = userId,
            GoalTitle = goalTitle,
            TargetAmount = (double)targetAmount,
            CurrentAmount = (double)currentAmount,
            DeadlineDate = deadlineDate
        };

        return await client.CalculateGoalProjectionAsync(request);
    }
}