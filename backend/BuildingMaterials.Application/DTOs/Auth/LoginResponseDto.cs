namespace BuildingMaterials.Application.DTOs.Auth;

public class LoginResponseDto
{
    public string Token { get; set; } = null!;
    public string? RefreshToken { get; set; }
    public int EmployeeId { get; set; }
    public string FullName { get; set; } = null!;
    public string Role { get; set; } = null!;
    public int? BranchId { get; set; }
    public string? BranchName { get; set; }
    public DateTime ExpiresAt { get; set; }
}
