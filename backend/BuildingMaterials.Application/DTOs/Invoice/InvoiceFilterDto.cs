namespace BuildingMaterials.Application.DTOs.Invoice;

public class InvoiceFilterDto : PagedFilterDto
{
    public int? Type { get; set; }
    public int? ClientId { get; set; }
    public int? RelatedInvoiceId { get; set; }
    public int? BranchId { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
}
