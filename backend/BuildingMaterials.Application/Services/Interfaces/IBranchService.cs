using BuildingMaterials.Application.DTOs.Branch;

namespace BuildingMaterials.Application.Services.Interfaces;

public interface IBranchService
{
    Task<IEnumerable<BranchDto>> GetAllAsync();
    Task<BranchDto> GetByIdAsync(int id);
    Task<BranchDto> CreateAsync(CreateBranchDto dto);
    Task UpdateAsync(int id, CreateBranchDto dto);
}
