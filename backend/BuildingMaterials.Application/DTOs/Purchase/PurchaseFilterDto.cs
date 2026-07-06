namespace BuildingMaterials.Application.DTOs.Purchase;

public class PurchaseFilterDto : PagedFilterDto
{
    public int? SupplierId { get; set; }
    public string? Status { get; set; }
    public int? BranchId { get; set; }
    public int? EmployeeId { get; set; }
}
