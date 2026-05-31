using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Product;
using BuildingMaterials.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildingMaterials.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet("filtered")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetFiltered([FromQuery] ProductFilterDto filter)
    {
        var result = await _productService.GetFilteredAsync(filter);
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetAll()
    {
        var products = await _productService.GetAllAsync();
        return Ok(products);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetById(int id)
    {
        var product = await _productService.GetByIdAsync(id);
        return Ok(product);
    }

    [HttpGet("categories")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _productService.GetCategoriesAsync();
        return Ok(categories);
    }

    [HttpGet("by-branch/{branchId}")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetByBranch(int branchId)
    {
        var products = await _productService.GetByBranchIdAsync(branchId);
        return Ok(products);
    }

    [HttpPost]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        var product = await _productService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateProductDto dto)
    {
        await _productService.UpdateAsync(id, dto);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> Delete(int id)
    {
        await _productService.DeleteAsync(id);
        return NoContent();
    }
}
