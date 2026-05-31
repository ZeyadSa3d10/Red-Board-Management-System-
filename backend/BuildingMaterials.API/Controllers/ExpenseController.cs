using BuildingMaterials.Application.DTOs.Expense;
using BuildingMaterials.Application.Services.Interfaces;
using BuildingMaterials.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildingMaterials.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExpenseController : ControllerBase
{
    private readonly IExpenseService _expenseService;

    public ExpenseController(IExpenseService expenseService)
    {
        _expenseService = expenseService;
    }

    [HttpPost]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> Create([FromBody] CreateExpenseDto dto)
    {
        var employeeId = int.Parse(User.FindFirst("employeeId")!.Value);
        var result = await _expenseService.CreateAsync(dto, employeeId);
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetAll([FromQuery] ExpenseFilterDto filter)
    {
        var result = await _expenseService.GetAllAsync(filter);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _expenseService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> Delete(int id)
    {
        await _expenseService.DeleteAsync(id);
        return NoContent();
    }
}
