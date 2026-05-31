using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Employee;

namespace BuildingMaterials.Application.Services.Interfaces;

public interface IEmployeeService
{
    Task<PagedResult<OwnerEmployeeDto>> GetFilteredAsync(EmployeeFilterDto filter);
    Task<IEnumerable<OwnerEmployeeDto>> GetAllAsync();
    Task<OwnerEmployeeDto> GetByIdAsync(int id);
    Task<EmployeeDto> CreateAsync(CreateEmployeeDto dto);
    Task<EmployeeDto> PaySalaryAsync(SalaryPaymentDto dto, int paidByEmployeeId);
    Task ResetPasswordAsync(int employeeId, ResetPasswordDto dto);
    Task<EmployeeDto> ToggleActiveAsync(int employeeId);
    Task DeleteAsync(int employeeId);
    Task<IEnumerable<SalaryPaymentResponseDto>> GetSalaryPaymentsAsync();
    Task AddAdvanceAsync(int employeeId, SalaryAdvanceDto dto, int paidByEmployeeId);
    Task<IEnumerable<SalaryAdvanceResponseDto>> GetAdvancesAsync(int employeeId);
    Task<IEnumerable<SalaryAdvanceResponseDto>> GetAllAdvancesAsync();
    Task<IEnumerable<SalaryPaymentResponseDto>> GetSalaryHistoryAsync(int employeeId);
    Task<IEnumerable<EmployeeDto>> GetPendingSalaryAsync(int month, int year);
    Task<IEnumerable<EmployeeDto>> GetByBranchAsync(int branchId);
}
