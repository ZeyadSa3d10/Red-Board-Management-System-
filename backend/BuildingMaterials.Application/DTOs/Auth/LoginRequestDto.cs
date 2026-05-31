namespace BuildingMaterials.Application.DTOs.Auth;

public class LoginRequestDto
{
    public string Phone { get; set; } = null!;
    public string Password { get; set; } = null!;
}
