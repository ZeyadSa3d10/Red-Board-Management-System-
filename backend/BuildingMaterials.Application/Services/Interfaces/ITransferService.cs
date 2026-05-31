using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Inventory;

namespace BuildingMaterials.Application.Services.Interfaces;

public interface ITransferService
{
    Task<TransferDto> CreateTransferAsync(CreateTransferDto dto, int employeeId);
    Task<PagedResult<TransferDto>> GetFilteredAsync(TransferFilterDto filter);
    Task<IEnumerable<TransferDto>> GetAllAsync();
}
