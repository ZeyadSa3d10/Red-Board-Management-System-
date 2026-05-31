using System.Security.Claims;
using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Purchase;
using BuildingMaterials.Application.DTOs.Supplier;
using BuildingMaterials.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildingMaterials.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PurchaseController : ControllerBase
{
    private readonly IPurchaseService _purchaseService;

    public PurchaseController(IPurchaseService purchaseService)
    {
        _purchaseService = purchaseService;
    }

    [HttpPost]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> Create([FromBody] CreatePurchaseInvoiceDto dto)
    {
        var employeeId = int.Parse(User.FindFirstValue("EmployeeId")!);
        var result = await _purchaseService.AddPurchaseInvoiceAsync(dto, employeeId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpGet("filtered")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetFiltered([FromQuery] PurchaseFilterDto filter)
    {
        var result = await _purchaseService.GetFilteredAsync(filter);
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetAll([FromQuery] int? branchId)
    {
        var invoices = await _purchaseService.GetAllAsync(branchId);
        return Ok(invoices);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetById(int id)
    {
        var invoice = await _purchaseService.GetByIdAsync(id);
        return Ok(invoice);
    }

    [HttpGet("supplier/{supplierId}")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetBySupplier(int supplierId)
    {
        var invoices = await _purchaseService.GetBySupplierIdAsync(supplierId);
        return Ok(invoices);
    }

    [HttpPost("{id}/payment")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> AddPayment(int id, [FromBody] SupplierPaymentDto dto)
    {
        var employeeId = int.Parse(User.FindFirstValue("EmployeeId")!);
        await _purchaseService.AddPaymentAsync(id, dto, employeeId);
        return Ok(new { message = "تم تسجيل الدفعة بنجاح" });
    }
}
