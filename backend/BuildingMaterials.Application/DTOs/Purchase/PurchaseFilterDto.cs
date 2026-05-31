namespace BuildingMaterials.Application.DTOs.Purchase;

public class PurchaseFilterDto : PagedFilterDto
{
    public int? SupplierId { get; set; }
    public string? Status { get; set; }
}
