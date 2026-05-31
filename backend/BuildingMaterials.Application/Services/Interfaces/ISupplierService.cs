using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Supplier;

namespace BuildingMaterials.Application.Services.Interfaces;

public interface ISupplierService
{
    Task<PagedResult<SupplierDto>> GetFilteredAsync(SupplierFilterDto filter);
    Task<IEnumerable<SupplierDto>> GetAllAsync();
    Task<SupplierDto> GetByIdAsync(int id);
    Task<SupplierDto> CreateAsync(CreateSupplierDto dto);
    Task UpdateAsync(int id, UpdateSupplierDto dto);
    Task AddPaymentAsync(int supplierId, SupplierIndependentPaymentDto dto, int employeeId);
    Task<SupplierStatementDto> GetStatementAsync(int supplierId);
}
