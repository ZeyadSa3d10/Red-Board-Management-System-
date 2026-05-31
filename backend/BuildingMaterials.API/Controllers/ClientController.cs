using System.Security.Claims;
using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Client;
using BuildingMaterials.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildingMaterials.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClientController : ControllerBase
{
    private readonly IClientService _clientService;

    public ClientController(IClientService clientService)
    {
        _clientService = clientService;
    }

    [HttpGet("filtered")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetFiltered([FromQuery] ClientFilterDto filter)
    {
        var result = await _clientService.GetFilteredAsync(filter);
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetAll()
    {
        var clients = await _clientService.GetAllAsync();
        return Ok(clients);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetById(int id)
    {
        var client = await _clientService.GetByIdAsync(id);
        return Ok(client);
    }

    [HttpGet("deferred")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> GetWithDeferred()
    {
        var clients = await _clientService.GetWithDeferredAsync();
        return Ok(clients);
    }

    [HttpPost]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> Create([FromBody] CreateClientDto dto)
    {
        var client = await _clientService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = client.Id }, client);
    }

    [HttpPost("{id}/payment")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> AddPayment(int id, [FromBody] ClientPaymentDto dto)
    {
        var employeeId = int.Parse(User.FindFirstValue("EmployeeId")!);
        await _clientService.AddPaymentAsync(id, dto, employeeId);
        return Ok(new { message = "تم تسجيل الدفعة بنجاح" });
    }

    [HttpGet("{id}/payments")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetPayments(int id, [FromQuery] int? branchId = null)
    {
        var payments = await _clientService.GetPaymentsAsync(id, branchId);
        return Ok(payments);
    }

    [HttpGet("{id}/statement")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetStatement(int id)
    {
        var statement = await _clientService.GetStatementAsync(id);
        return Ok(statement);
    }
}
