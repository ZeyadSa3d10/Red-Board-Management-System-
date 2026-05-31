using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using BuildingMaterials.Application.DTOs.Auth;
using BuildingMaterials.Application.Services.Interfaces;
using BuildingMaterials.Domain.Entities;
using BuildingMaterials.Domain.Exceptions;
using BuildingMaterials.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BuildingMaterials.Application.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext context, IMapper mapper, IConfiguration configuration)
    {
        _context = context;
        _mapper = mapper;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto dto)
    {
        var employee = await _context.Employees
            .Include(x => x.Branch)
            .FirstOrDefaultAsync(x => x.Phone == dto.Phone && x.IsActive)
            ?? throw new UnauthorizedException("بيانات الدخول غير صحيحة");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, employee.PasswordHash))
            throw new UnauthorizedException("بيانات الدخول غير صحيحة");

        var token = GenerateJwtToken(employee);
        var refreshToken = await GenerateAndStoreRefreshToken(employee.Id);

        return new LoginResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            EmployeeId = employee.Id,
            FullName = employee.FullName,
            Role = employee.Role.ToString(),
            BranchId = employee.BranchId,
            BranchName = employee.Branch?.Name,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
    }

    public async Task<RefreshTokenResponseDto> RefreshTokenAsync(string refreshToken)
    {
        var tokenHash = HashToken(refreshToken);
        var storedToken = await _context.RefreshTokens
            .Include(x => x.Employee)
            .FirstOrDefaultAsync(x => x.Token == tokenHash && !x.IsRevoked)
            ?? throw new UnauthorizedException("رمز التحديث غير صالح");

        if (storedToken.ExpiresAt < DateTime.UtcNow)
            throw new UnauthorizedException("انتهت صلاحية رمز التحديث");

        storedToken.IsRevoked = true;

        var newJwt = GenerateJwtToken(storedToken.Employee);
        var newRefresh = await GenerateAndStoreRefreshToken(storedToken.Employee.Id);

        await _context.SaveChangesAsync();

        return new RefreshTokenResponseDto
        {
            Token = newJwt,
            RefreshToken = newRefresh,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
    }

    public async Task ChangePasswordAsync(int employeeId, ChangePasswordDto dto)
    {
        var employee = await _context.Employees.FindAsync(employeeId)
            ?? throw new NotFoundException("الموظف غير موجود");

        if (!BCrypt.Net.BCrypt.Verify(dto.OldPassword, employee.PasswordHash))
            throw new BusinessException("كلمة المرور القديمة غير صحيحة");

        employee.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

        var tokens = await _context.RefreshTokens
            .Where(x => x.EmployeeId == employeeId && !x.IsRevoked)
            .ToListAsync();
        tokens.ForEach(t => t.IsRevoked = true);

        await _context.SaveChangesAsync();
    }

    public async Task<LoginResponseDto> GetCurrentUserAsync(int employeeId)
    {
        var employee = await _context.Employees
            .Include(x => x.Branch)
            .FirstOrDefaultAsync(x => x.Id == employeeId)
            ?? throw new NotFoundException("الموظف غير موجود");

        return new LoginResponseDto
        {
            EmployeeId = employee.Id,
            FullName = employee.FullName,
            Role = employee.Role.ToString(),
            BranchId = employee.BranchId,
            BranchName = employee.Branch?.Name,
            ExpiresAt = DateTime.UtcNow
        };
    }

    private string GenerateJwtToken(Employee employee)
    {
        var jwtSecret = _configuration["JwtSettings:SecretKey"];
        if (string.IsNullOrEmpty(jwtSecret))
            jwtSecret = Environment.GetEnvironmentVariable("ASPNETCORE_JWT_SECRET");
        if (string.IsNullOrEmpty(jwtSecret))
            throw new InvalidOperationException("JWT SecretKey is not configured.");

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, employee.Id.ToString()),
            new Claim(ClaimTypes.Name, employee.FullName),
            new Claim(ClaimTypes.Role, employee.Role.ToString()),
            new Claim("BranchId", employee.BranchId?.ToString() ?? ""),
            new Claim("EmployeeId", employee.Id.ToString())
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSecret!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(int.Parse(_configuration["JwtSettings:ExpiryDays"] ?? "7")),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<string> GenerateAndStoreRefreshToken(int employeeId)
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        var token = Convert.ToBase64String(randomBytes);
        var tokenHash = HashToken(token);

        _context.RefreshTokens.Add(new RefreshToken
        {
            EmployeeId = employeeId,
            Token = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            IsRevoked = false
        });

        await _context.SaveChangesAsync();
        return token;
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }
}
