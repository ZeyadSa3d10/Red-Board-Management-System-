using System.Security.Claims;
using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Inventory;
using BuildingMaterials.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildingMaterials.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransferController : ControllerBase
{
    private readonly ITransferService _transferService;

    public TransferController(ITransferService transferService)
    {
        _transferService = transferService;
    }

    [HttpPost]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> Create([FromBody] CreateTransferDto dto)
    {
        var employeeId = int.Parse(User.FindFirstValue("EmployeeId")!);
        var result = await _transferService.CreateTransferAsync(dto, employeeId);
        return Ok(result);
    }

    [HttpGet("filtered")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetFiltered([FromQuery] TransferFilterDto filter)
    {
        var result = await _transferService.GetFilteredAsync(filter);
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetAll()
    {
        var transfers = await _transferService.GetAllAsync();
        return Ok(transfers);
    }

}
