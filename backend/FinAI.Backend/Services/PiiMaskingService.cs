using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace FinAI.Backend.Services;

public class PiiMaskingService : IPiiMaskingService
{
    // Regex Desenleri (IBAN, Kredi Kartı, TC Kimlik, E-posta, Telefon)
    private static readonly Regex IbanRegex = new(@"TR\d{2}\s?(\d{4}\s?){5}\d{2}", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex CreditCardRegex = new(@"\b(?:\d[ -]*?){13,16}\b", RegexOptions.Compiled);
    private static readonly Regex TcKimlikRegex = new(@"\b[1-9]\d{10}\b", RegexOptions.Compiled);
    private static readonly Regex EmailRegex = new(@"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", RegexOptions.Compiled);
    private static readonly Regex PhoneRegex = new(@"(\+90|0)?\s*[5]\d{2}\s*\d{3}\s*\d{2}\s*\d{2}", RegexOptions.Compiled);

    // Oturum bazlı geri çözülebilir Token Eşleme Haritası (Session Token Mapping)
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, string>> _sessionTokenMaps = new();

    public string MaskSensitiveData(string inputText)
    {
        if (string.IsNullOrWhiteSpace(inputText))
            return inputText;

        string maskedText = inputText;
        maskedText = IbanRegex.Replace(maskedText, "[MASKED_IBAN]");
        maskedText = CreditCardRegex.Replace(maskedText, "[MASKED_CARD]");
        maskedText = TcKimlikRegex.Replace(maskedText, "[MASKED_TCKN]");
        maskedText = EmailRegex.Replace(maskedText, "[MASKED_EMAIL]");
        maskedText = PhoneRegex.Replace(maskedText, "[MASKED_PHONE]");

        return maskedText;
    }

    public string MaskAndTokenize(string inputText, string sessionId)
    {
        if (string.IsNullOrWhiteSpace(inputText))
            return inputText;

        var tokenMap = _sessionTokenMaps.GetOrAdd(sessionId, _ => new ConcurrentDictionary<string, string>());
        string maskedText = inputText;
        int counter = 1;

        maskedText = IbanRegex.Replace(maskedText, match =>
        {
            var token = $"[IBAN_{counter++}]";
            tokenMap[token] = match.Value;
            return token;
        });

        maskedText = CreditCardRegex.Replace(maskedText, match =>
        {
            var token = $"[CARD_{counter++}]";
            tokenMap[token] = match.Value;
            return token;
        });

        maskedText = TcKimlikRegex.Replace(maskedText, match =>
        {
            var token = $"[TCKN_{counter++}]";
            tokenMap[token] = match.Value;
            return token;
        });

        maskedText = EmailRegex.Replace(maskedText, match =>
        {
            var token = $"[EMAIL_{counter++}]";
            tokenMap[token] = match.Value;
            return token;
        });

        maskedText = PhoneRegex.Replace(maskedText, match =>
        {
            var token = $"[PHONE_{counter++}]";
            tokenMap[token] = match.Value;
            return token;
        });

        return maskedText;
    }

    public string UnmaskSensitiveData(string maskedText, string sessionId)
    {
        if (string.IsNullOrWhiteSpace(maskedText) || !_sessionTokenMaps.TryGetValue(sessionId, out var tokenMap))
            return maskedText;

        string unmaskedText = maskedText;
        foreach (var kvp in tokenMap)
        {
            unmaskedText = unmaskedText.Replace(kvp.Key, kvp.Value);
        }

        return unmaskedText;
    }
}