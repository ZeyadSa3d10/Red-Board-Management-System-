using System.Security.Claims;
using BuildingMaterials.Application.DTOs.Auth;
using BuildingMaterials.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BuildingMaterials.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        var result = await _authService.LoginAsync(dto);

        SetAuthCookies(result.Token, result.RefreshToken, result.ExpiresAt);

        return Ok(new
        {
            employeeId = result.EmployeeId,
            fullName = result.FullName,
            role = result.Role,
            branchId = result.BranchId,
            branchName = result.BranchName,
            expiresAt = result.ExpiresAt
        });
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Refresh()
    {
        var refreshToken = Request.Cookies["erp_refresh_token"];
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(new { message = "رمز التحديث غير صالح" });

        var result = await _authService.RefreshTokenAsync(refreshToken);
        SetAuthCookies(result.Token, result.RefreshToken, result.ExpiresAt);

        return Ok(new { expiresAt = result.ExpiresAt });
    }

    [HttpPost("change-password")]
    [Authorize]
    [EnableRateLimiting("strict")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var employeeId = int.Parse(User.FindFirstValue("EmployeeId")!);
        await _authService.ChangePasswordAsync(employeeId, dto);
        return Ok(new { message = "تم تغيير كلمة المرور بنجاح" });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var employeeId = int.Parse(User.FindFirstValue("EmployeeId")!);
        var result = await _authService.GetCurrentUserAsync(employeeId);
        return Ok(result);
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("erp_token");
        Response.Cookies.Delete("erp_refresh_token");
        return Ok(new { message = "تم تسجيل الخروج بنجاح" });
    }

    private void SetAuthCookies(string token, string refreshToken, DateTime expiresAt)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = expiresAt
        };
        Response.Cookies.Append("erp_token", token, cookieOptions);

        var refreshOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(30)
        };
        Response.Cookies.Append("erp_refresh_token", refreshToken, refreshOptions);
    }
}
