using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FinAI.Backend.Data;
using FinAI.Backend.Dtos;
using FinAI.Backend.Entities;
using FinAI.Backend.Extensions;
using FinAI.Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace FinAI.Backend.Endpoints;

public static class AdvisorEndpoints
{
    public static void MapAdvisorEndpoints(this WebApplication app)
    {
        // İki yol da (geriye dönük uyumluluk için) aynı sohbet mantığını paylaşır — tek kaynak (DRY)
        app.MapPost("/api/advisor/chat", HandleChatAsync)
            .RequireRateLimiting("gemini-policy").RequireAuthorization();

        app.MapPost("/api/chat", HandleChatAsync)
            .RequireRateLimiting("gemini-policy").RequireAuthorization();
    }

    private static async Task<IResult> HandleChatAsync(AdvisorChatRequestDto dto, ClaimsPrincipal principal, IAiClientService aiClient)
    {
        try
        {
            var callerId = principal.GetUserId();
            if (string.IsNullOrWhiteSpace(callerId))
            {
                return Results.Unauthorized();
            }
            if (string.IsNullOrWhiteSpace(dto.Message))
            {
                return Results.BadRequest(new { message = "Mesaj zorunludur." });
            }

            var response = await aiClient.ChatWithAdvisorAsync(callerId, dto.Message, dto.History, dto.ContextJson);
            return Results.Ok(new { reply = response.Reply });
        }
        catch (Exception ex)
        {
            return Results.BadRequest(new { message = $"Sohbet servisi hatası: {ex.Message}" });
        }
    }
}
