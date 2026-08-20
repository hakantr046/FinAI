using System.Security.Claims;

namespace FinAI.Backend.Extensions;

public static class ClaimsPrincipalExtensions
{
    // Doğrulanmış JWT'den kullanıcı kimliğini döner. Route/DTO'dan gelen
    // userId asla güvenilmez — IDOR'u önlemek için tek gerçek kaynak budur.
    public static string? GetUserId(this ClaimsPrincipal principal) =>
        principal.FindFirstValue(ClaimTypes.NameIdentifier);
}
