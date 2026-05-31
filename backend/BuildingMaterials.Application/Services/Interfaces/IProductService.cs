using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Product;

namespace BuildingMaterials.Application.Services.Interfaces;

public interface IProductService
{
    Task<PagedResult<ProductDto>> GetFilteredAsync(ProductFilterDto filter);
    Task<IEnumerable<ProductDto>> GetAllAsync();
    Task<ProductDto> GetByIdAsync(int id);
    Task<ProductDto> CreateAsync(CreateProductDto dto);
    Task UpdateAsync(int id, CreateProductDto dto);
    Task DeleteAsync(int id);
    Task<IEnumerable<ProductDto>> GetByBranchIdAsync(int branchId);
    Task<IEnumerable<CategoryDto>> GetCategoriesAsync();
}
