namespace BuildingMaterials.Application.DTOs.Report;

public class LedgerFilterDto : PagedFilterDto
{
    public new DateTime? DateFrom { get; set; }
    public new DateTime? DateTo { get; set; }
    public new int? BranchId { get; set; }
}
