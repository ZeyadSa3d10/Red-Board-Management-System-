using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Expense;

namespace BuildingMaterials.Application.Services.Interfaces;

public interface IExpenseService
{
    Task<ExpenseResponseDto> CreateAsync(CreateExpenseDto dto, int employeeId);
    Task<ExpenseResponseDto> GetByIdAsync(int id);
    Task<PagedResult<ExpenseResponseDto>> GetAllAsync(ExpenseFilterDto? filter = null);
    Task DeleteAsync(int id);
}
