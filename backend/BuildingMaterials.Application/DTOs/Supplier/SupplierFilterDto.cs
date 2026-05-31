namespace BuildingMaterials.Application.DTOs.Supplier;

public class SupplierFilterDto : PagedFilterDto
{
    public bool? HasDueOnly { get; set; }
}
