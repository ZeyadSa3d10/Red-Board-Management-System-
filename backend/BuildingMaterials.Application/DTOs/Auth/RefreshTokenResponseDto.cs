namespace BuildingMaterials.Application.DTOs.Auth;

public class RefreshTokenResponseDto
{
    public string Token { get; set; } = null!;
    public string RefreshToken { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
}
