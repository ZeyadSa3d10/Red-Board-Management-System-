using System.Security.Claims;
using BuildingMaterials.Application.DTOs.Invoice;
using BuildingMaterials.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildingMaterials.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvoiceController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;

    public InvoiceController(IInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    [HttpPost("sale")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> CreateSaleInvoice([FromBody] CreateSaleInvoiceDto dto)
    {
        var employeeId = int.Parse(User.FindFirstValue("EmployeeId")!);
        var result = await _invoiceService.CreateSaleInvoiceAsync(dto, employeeId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("deferred")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> CreateDeferredInvoice([FromBody] CreateDeferredInvoiceDto dto)
    {
        var employeeId = int.Parse(User.FindFirstValue("EmployeeId")!);
        var result = await _invoiceService.CreateDeferredInvoiceAsync(dto, employeeId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("return")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> CreateReturnInvoice([FromBody] CreateReturnInvoiceDto dto)
    {
        var employeeId = int.Parse(User.FindFirstValue("EmployeeId")!);
        var result = await _invoiceService.CreateReturnInvoiceAsync(dto, employeeId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("supply-installation")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> CreateSupplyInstallationInvoice([FromBody] CreateSupplyInstallationDto dto)
    {
        var employeeId = int.Parse(User.FindFirstValue("EmployeeId")!);
        var result = await _invoiceService.CreateSupplyInstallationInvoiceAsync(dto, employeeId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpGet]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetInvoices(
        [FromQuery] int? branchId,
        [FromQuery] int? type,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int? clientId,
        [FromQuery] int? relatedInvoiceId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userBranchId = User.FindFirstValue("BranchId");
        var userRole = User.FindFirstValue(ClaimTypes.Role);
        var filter = new InvoiceFilterDto
        {
            BranchId = branchId,
            Type = type,
            DateFrom = dateFrom,
            DateTo = dateTo,
                ClientId = clientId,
                RelatedInvoiceId = relatedInvoiceId,
                PageNumber = page,
                PageSize = Math.Min(pageSize, 100)
        };
        if (userRole == "Staff" && !filter.BranchId.HasValue)
            filter.BranchId = int.Parse(userBranchId!);
        var result = await _invoiceService.GetInvoicesAsync(filter);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _invoiceService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpGet("by-number/{invoiceNumber}")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetByInvoiceNumber(string invoiceNumber)
    {
        var result = await _invoiceService.GetByInvoiceNumberAsync(invoiceNumber);
        return Ok(result);
    }

    [HttpGet("daily-revenue")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetDailyRevenue([FromQuery] int branchId, [FromQuery] DateTime? date)
    {
        var targetDate = date ?? DateTime.Today;
        var result = await _invoiceService.GetDailyRevenueAsync(branchId, targetDate);
        return Ok(result);
    }

    [HttpPut("{id}/cancel")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> CancelInvoice(int id)
    {
        var employeeId = int.Parse(User.FindFirstValue("EmployeeId")!);
        await _invoiceService.CancelInvoiceAsync(id, employeeId);
        return Ok(new { message = "تم إلغاء الفاتورة بنجاح" });
    }

    [HttpGet("{id}/print")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetPrintData(int id)
    {
        var result = await _invoiceService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpGet("daily-revenue/all")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> GetDailyRevenueAll([FromQuery] DateTime? date)
    {
        var targetDate = date ?? DateTime.Today;
        var result = await _invoiceService.GetDailyRevenueAllBranchesAsync(targetDate);
        return Ok(result);
    }
}
