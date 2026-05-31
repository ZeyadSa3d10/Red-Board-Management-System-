using BuildingMaterials.Application.DTOs.Inventory;

namespace BuildingMaterials.Application.Services.Interfaces;

public interface IInventoryService
{
    Task<IEnumerable<InventoryDto>> GetAllAsync();
    Task<IEnumerable<InventoryDto>> GetByBranchIdAsync(int branchId);
    Task<IEnumerable<LowStockDto>> GetLowStockAsync();
    Task<IEnumerable<InventoryMatrixDto>> GetMatrixAsync();
    Task<LowStockCountDto> GetLowStockCountAsync();
}
