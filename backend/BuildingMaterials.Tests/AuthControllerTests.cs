using System.Net.Http.Json;
using BuildingMaterials.Application.DTOs.Auth;
using BuildingMaterials.Infrastructure.Data;
using BuildingMaterials.Tests;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingMaterials.Tests;

public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public AuthControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        var response = await _client.PostAsJsonAsync("/api/Auth/login", new LoginRequestDto
        {
            Phone = "01000000001",
            Password = "Owner123"
        });

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<LoginResponseDto>();
        result.Should().NotBeNull();
        result!.Token.Should().NotBeNullOrEmpty();
        result.Role.Should().Be("Owner");
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ReturnsUnauthorized()
    {
        var response = await _client.PostAsJsonAsync("/api/Auth/login", new LoginRequestDto
        {
            Phone = "01000000001",
            Password = "WrongPassword"
        });

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_WithNonExistentPhone_ReturnsUnauthorized()
    {
        var response = await _client.PostAsJsonAsync("/api/Auth/login", new LoginRequestDto
        {
            Phone = "99999999999",
            Password = "SomePass1"
        });

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized);
    }
}
