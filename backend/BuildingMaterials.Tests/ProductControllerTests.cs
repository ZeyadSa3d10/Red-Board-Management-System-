using System.Net.Http.Headers;
using System.Net.Http.Json;
using BuildingMaterials.Application.DTOs.Auth;
using BuildingMaterials.Application.DTOs.Product;
using FluentAssertions;

namespace BuildingMaterials.Tests;

public class ProductControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private string _token = "";

    public ProductControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task AuthenticateAsync()
    {
        if (!string.IsNullOrEmpty(_token)) return;
        var response = await _client.PostAsJsonAsync("/api/Auth/login", new LoginRequestDto
        {
            Phone = "01000000001",
            Password = "Owner123"
        });
        var result = await response.Content.ReadFromJsonAsync<LoginResponseDto>();
        _token = result!.Token;
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _token);
    }

    [Fact]
    public async Task GetAll_ReturnsProducts()
    {
        await AuthenticateAsync();
        var response = await _client.GetAsync("/api/Product");
        response.EnsureSuccessStatusCode();
        var products = await response.Content.ReadFromJsonAsync<List<ProductDto>>();
        products.Should().NotBeNull();
        products!.Count.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task CreateProduct_WithValidData_ReturnsCreated()
    {
        await AuthenticateAsync();
        var dto = new CreateProductDto
        {
            Name = "اختبار منتج",
            Unit = "قطعة",
            CurrentSalePrice = 100,
            MinSalePrice = 80,
            CategoryId = 1
        };
        var response = await _client.PostAsJsonAsync("/api/Product", dto);
        response.EnsureSuccessStatusCode();
        var product = await response.Content.ReadFromJsonAsync<ProductDto>();
        product.Should().NotBeNull();
        product!.Name.Should().Be("اختبار منتج");
    }

    [Fact]
    public async Task GetById_ReturnsProduct()
    {
        await AuthenticateAsync();
        var response = await _client.GetAsync("/api/Product/1");
        response.EnsureSuccessStatusCode();
        var product = await response.Content.ReadFromJsonAsync<ProductDto>();
        product.Should().NotBeNull();
        product!.Id.Should().Be(1);
    }

    [Fact]
    public async Task GetCategories_ReturnsList()
    {
        await AuthenticateAsync();
        var response = await _client.GetAsync("/api/Product/categories");
        response.EnsureSuccessStatusCode();
        var categories = await response.Content.ReadFromJsonAsync<List<CategoryDto>>();
        categories.Should().NotBeNull();
        categories!.Count.Should().BeGreaterThan(0);
    }
}
