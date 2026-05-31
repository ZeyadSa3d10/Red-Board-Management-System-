using BuildingMaterials.Application.DTOs.Branch;
using BuildingMaterials.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildingMaterials.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BranchController : ControllerBase
{
    private readonly IBranchService _branchService;

    public BranchController(IBranchService branchService)
    {
        _branchService = branchService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var branches = await _branchService.GetAllAsync();
        return Ok(branches);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var branch = await _branchService.GetByIdAsync(id);
        return Ok(branch);
    }

    [HttpPost]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> Create([FromBody] CreateBranchDto dto)
    {
        var branch = await _branchService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = branch.Id }, branch);
    }
}
