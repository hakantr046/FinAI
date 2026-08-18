using FinAI.Backend.Entities;

namespace FinAI.Backend.Services;

public interface ITokenService
{
    (string accessToken, RefreshToken refreshToken) GenerateTokenPair(User user);
}
