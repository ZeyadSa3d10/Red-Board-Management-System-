using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Purchase;

namespace BuildingMaterials.Application.Services.Interfaces;

public interface IPurchaseService
{
    Task<PurchaseInvoiceResponseDto> AddPurchaseInvoiceAsync(CreatePurchaseInvoiceDto dto, int employeeId);
    Task<PagedResult<PurchaseInvoiceResponseDto>> GetFilteredAsync(PurchaseFilterDto filter);
    Task<IEnumerable<PurchaseInvoiceResponseDto>> GetBySupplierIdAsync(int supplierId);
    Task<IEnumerable<PurchaseInvoiceResponseDto>> GetAllAsync(int? branchId = null);
    Task<PurchaseInvoiceResponseDto> GetByIdAsync(int id);
    Task AddPaymentAsync(int purchaseId, Application.DTOs.Supplier.SupplierPaymentDto dto, int employeeId);
}
