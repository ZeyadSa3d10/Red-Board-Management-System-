using AutoMapper;
using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Expense;
using BuildingMaterials.Application.Services.Interfaces;
using BuildingMaterials.Domain.Entities;
using BuildingMaterials.Domain.Exceptions;
using BuildingMaterials.Infrastructure.Data;
using BuildingMaterials.Application.Extensions;
using BuildingMaterials.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterials.Application.Services;

public class ExpenseService : IExpenseService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public ExpenseService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<ExpenseResponseDto> CreateAsync(CreateExpenseDto dto, int employeeId)
    {
        var expense = new BranchExpense
        {
            BranchId = dto.BranchId,
            Description = dto.Description,
            Amount = dto.Amount,
            ExpenseDate = dto.ExpenseDate,
            Notes = dto.Notes,
            CreatedByEmployeeId = employeeId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Add(expense);
        await _context.SaveChangesAsync();

        return _mapper.Map<ExpenseResponseDto>(expense);
    }

    public async Task<ExpenseResponseDto> GetByIdAsync(int id)
    {
        var expense = await _context.Set<BranchExpense>()
            .Include(x => x.Branch)
            .Include(x => x.CreatedBy)
            .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new NotFoundException("المصروف غير موجود");

        return _mapper.Map<ExpenseResponseDto>(expense);
    }

    public async Task<PagedResult<ExpenseResponseDto>> GetAllAsync(ExpenseFilterDto? filter = null)
    {
        if (filter == null)
            filter = new ExpenseFilterDto();

        var query = _context.Set<BranchExpense>()
            .Include(x => x.Branch)
            .Include(x => x.CreatedBy)
            .AsQueryable()
            .ApplySearch(filter.Search, e => e.Description)
            .ApplyWhereIf(filter.BranchId.HasValue, e => e.BranchId == filter.BranchId!.Value)
            .ApplyWhereIf(filter.DateFrom.HasValue, e => e.ExpenseDate >= filter.DateFrom!.Value)
            .ApplyWhereIf(filter.DateTo.HasValue, e => e.ExpenseDate <= filter.DateTo!.Value);

        return await query.ToPagedResultAsync<BranchExpense, ExpenseResponseDto>(filter, _mapper);
    }

    public async Task DeleteAsync(int id)
    {
        var expense = await _context.Set<BranchExpense>().FindAsync(id)
            ?? throw new NotFoundException("المصروف غير موجود");

        _context.Remove(expense);
        await _context.SaveChangesAsync();
    }
}
