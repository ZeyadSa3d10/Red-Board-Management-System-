using BuildingMaterials.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildingMaterials.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Owner,Accountant,Staff")]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    [HttpGet("stock")]
    public async Task<IActionResult> GetAll()
    {
        var inventory = await _inventoryService.GetAllAsync();
        return Ok(inventory);
    }

    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock()
    {
        var lowStock = await _inventoryService.GetLowStockAsync();
        return Ok(lowStock);
    }

    [HttpGet("branch/{branchId}")]
    public async Task<IActionResult> GetByBranch(int branchId)
    {
        var inventory = await _inventoryService.GetByBranchIdAsync(branchId);
        return Ok(inventory);
    }

    [HttpGet("matrix")]
    public async Task<IActionResult> GetMatrix()
    {
        var matrix = await _inventoryService.GetMatrixAsync();
        return Ok(matrix);
    }

    [HttpGet("low-stock/count")]
    public async Task<IActionResult> GetLowStockCount()
    {
        var count = await _inventoryService.GetLowStockCountAsync();
        return Ok(count);
    }
}
