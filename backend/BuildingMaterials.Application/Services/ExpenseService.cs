using AutoMapper;
using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Expense;
using BuildingMaterials.Application.Services.Interfaces;
using BuildingMaterials.Domain.Entities;
using BuildingMaterials.Domain.Exceptions;
using BuildingMaterials.Infrastructure.Data;
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
        var query = _context.Set<BranchExpense>()
            .Include(x => x.Branch)
            .Include(x => x.CreatedBy)
            .AsQueryable();

        if (filter != null)
        {
            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var q = filter.Search.ToLower();
                query = query.Where(x => x.Description.ToLower().Contains(q));
            }
            if (filter.BranchId.HasValue)
                query = query.Where(x => x.BranchId == filter.BranchId.Value);
            if (filter.DateFrom.HasValue)
                query = query.Where(x => x.ExpenseDate >= filter.DateFrom.Value);
            if (filter.DateTo.HasValue)
                query = query.Where(x => x.ExpenseDate <= filter.DateTo.Value);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.ExpenseDate)
            .Skip(((filter?.PageNumber ?? 1) - 1) * (filter?.PageSize ?? 20))
            .Take(filter?.PageSize ?? 20)
            .ToListAsync();

        return new PagedResult<ExpenseResponseDto>
        {
            Items = _mapper.Map<List<ExpenseResponseDto>>(items),
            TotalCount = totalCount,
            PageNumber = filter?.PageNumber ?? 1,
            PageSize = filter?.PageSize ?? 20
        };
    }

    public async Task DeleteAsync(int id)
    {
        var expense = await _context.Set<BranchExpense>().FindAsync(id)
            ?? throw new NotFoundException("المصروف غير موجود");

        _context.Remove(expense);
        await _context.SaveChangesAsync();
    }
}
