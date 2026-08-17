namespace FinAI.Backend.Services;

public interface IPiiMaskingService
{
    string MaskSensitiveData(string inputText);
    string MaskAndTokenize(string inputText, string sessionId);
    string UnmaskSensitiveData(string maskedText, string sessionId);
}