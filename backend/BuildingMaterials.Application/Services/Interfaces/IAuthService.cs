using BuildingMaterials.Application.DTOs.Auth;

namespace BuildingMaterials.Application.Services.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto dto);
    Task<RefreshTokenResponseDto> RefreshTokenAsync(string refreshToken);
    Task ChangePasswordAsync(int employeeId, ChangePasswordDto dto);
    Task<LoginResponseDto> GetCurrentUserAsync(int employeeId);
}
