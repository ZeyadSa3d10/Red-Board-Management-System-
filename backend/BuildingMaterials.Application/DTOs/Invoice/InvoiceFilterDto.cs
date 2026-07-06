namespace BuildingMaterials.Application.DTOs.Invoice;

public class InvoiceFilterDto : PagedFilterDto
{
    public int? Type { get; set; }
    public string? Types { get; set; }
    public int? ClientId { get; set; }
    public int? RelatedInvoiceId { get; set; }
    public new int? BranchId { get; set; }
    public new DateTime? DateFrom { get; set; }
    public new DateTime? DateTo { get; set; }
    public int? EmployeeId { get; set; }
}
