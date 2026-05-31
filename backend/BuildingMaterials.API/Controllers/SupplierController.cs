using System.Security.Claims;
using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Supplier;
using BuildingMaterials.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildingMaterials.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SupplierController : ControllerBase
{
    private readonly ISupplierService _supplierService;

    public SupplierController(ISupplierService supplierService)
    {
        _supplierService = supplierService;
    }

    [HttpGet("filtered")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> GetFiltered([FromQuery] SupplierFilterDto filter)
    {
        var result = await _supplierService.GetFilteredAsync(filter);
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> GetAll()
    {
        var suppliers = await _supplierService.GetAllAsync();
        return Ok(suppliers);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> GetById(int id)
    {
        var supplier = await _supplierService.GetByIdAsync(id);
        return Ok(supplier);
    }

    [HttpPost]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> Create([FromBody] CreateSupplierDto dto)
    {
        var supplier = await _supplierService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = supplier.Id }, supplier);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSupplierDto dto)
    {
        await _supplierService.UpdateAsync(id, dto);
        return Ok(new { message = "تم تحديث المورد بنجاح" });
    }

    [HttpPost("{id}/payment")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> AddPayment(int id, [FromBody] SupplierIndependentPaymentDto dto)
    {
        var employeeId = int.Parse(User.FindFirstValue("EmployeeId")!);
        await _supplierService.AddPaymentAsync(id, dto, employeeId);
        return Ok(new { message = "تم تسجيل الدفعة بنجاح" });
    }

    [HttpGet("{id}/statement")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> GetStatement(int id)
    {
        var statement = await _supplierService.GetStatementAsync(id);
        return Ok(statement);
    }
}
