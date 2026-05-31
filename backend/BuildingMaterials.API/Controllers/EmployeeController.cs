using System.Security.Claims;
using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Employee;
using BuildingMaterials.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildingMaterials.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeeController : ControllerBase
{
    private readonly IEmployeeService _employeeService;

    public EmployeeController(IEmployeeService employeeService)
    {
        _employeeService = employeeService;
    }

    [HttpGet("filtered")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetFiltered([FromQuery] EmployeeFilterDto filter)
    {
        var userBranchId = User.FindFirstValue("BranchId");
        var role = User.FindFirstValue(ClaimTypes.Role);
        if (role == "Staff" && !filter.BranchId.HasValue)
            filter.BranchId = int.Parse(userBranchId!);
        var result = await _employeeService.GetFilteredAsync(filter);
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetAll()
    {
        var employees = await _employeeService.GetAllAsync();
        return Ok(employees);
    }

    [HttpGet("branch/{branchId}")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetByBranch(int branchId)
    {
        // Security check: Staff can only view their own branch
        var userBranchId = User.FindFirstValue("BranchId");
        var role = User.FindFirstValue(ClaimTypes.Role);
        
        if (role != "Owner" && role != "Accountant" && userBranchId != branchId.ToString())
        {
            return Forbid();
        }

        var employees = await _employeeService.GetByBranchAsync(branchId);

        // Staff should not see sensitive data like NationalId and Salary
        if (role == "Staff")
        {
            var staffView = employees.Select(e => new BuildingMaterials.Application.DTOs.Employee.StaffEmployeeDto
            {
                Id = e.Id,
                FullName = e.FullName,
                Phone = e.Phone,
                Role = e.Role,
                JoinDate = e.JoinDate,
                IsActive = e.IsActive,
                BranchId = e.BranchId,
                BranchName = e.BranchName
            });
            return Ok(staffView);
        }

        // Accountant and Owner see employee list without PII via GetByBranch
        // Owner can get full data (with NationalId/Salary) via GetAll() or GetById()
        return Ok(employees);
    }

    [HttpGet("salary-payments")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetSalaryPayments()
    {
        var payments = await _employeeService.GetSalaryPaymentsAsync();
        return Ok(payments);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetById(int id)
    {
        var employee = await _employeeService.GetByIdAsync(id);
        return Ok(employee);
    }

    [HttpPost]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeDto dto)
    {
        var employee = await _employeeService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = employee.Id }, employee);
    }

    [HttpPost("{id}/reset-password")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordDto dto)
    {
        await _employeeService.ResetPasswordAsync(id, dto);
        return Ok(new { message = "تم تغيير كلمة المرور بنجاح" });
    }

    [HttpPut("{id}/toggle-active")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var employee = await _employeeService.ToggleActiveAsync(id);
        return Ok(employee);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> Delete(int id)
    {
        await _employeeService.DeleteAsync(id);
        return Ok(new { message = "تم حذف الموظف" });
    }

    [HttpPost("{id}/salary")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> PaySalary(int id, [FromBody] SalaryPaymentDto dto)
    {
        dto.EmployeeId = id;
        var paidByEmployeeId = int.Parse(User.FindFirstValue("EmployeeId")!);
        var result = await _employeeService.PaySalaryAsync(dto, paidByEmployeeId);
        return Ok(result);
    }

    [HttpPost("{id}/advance")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> AddAdvance(int id, [FromBody] SalaryAdvanceDto dto)
    {
        var paidByEmployeeId = int.Parse(User.FindFirstValue("EmployeeId")!);
        await _employeeService.AddAdvanceAsync(id, dto, paidByEmployeeId);
        return Ok(new { message = "تم تسجيل السلفة بنجاح" });
    }

    [HttpGet("{id}/advances")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetAdvances(int id)
    {
        var advances = await _employeeService.GetAdvancesAsync(id);
        return Ok(advances);
    }

    [HttpGet("advances")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetAllAdvances()
    {
        var advances = await _employeeService.GetAllAdvancesAsync();
        return Ok(advances);
    }

    [HttpGet("{id}/salary-history")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetSalaryHistory(int id)
    {
        var history = await _employeeService.GetSalaryHistoryAsync(id);
        return Ok(history);
    }

    [HttpGet("salary-pending")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetPendingSalary([FromQuery] int month, [FromQuery] int year)
    {
        var employees = await _employeeService.GetPendingSalaryAsync(month, year);
        return Ok(employees);
    }
}
