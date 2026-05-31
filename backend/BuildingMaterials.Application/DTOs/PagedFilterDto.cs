namespace BuildingMaterials.Application.DTOs;

public class PagedFilterDto
{
    public string? Search { get; set; }
    public int? BranchId { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
