namespace BuildingMaterials.Application.DTOs.Product;

public class ProductFilterDto : PagedFilterDto
{
    public int? CategoryId { get; set; }
}
