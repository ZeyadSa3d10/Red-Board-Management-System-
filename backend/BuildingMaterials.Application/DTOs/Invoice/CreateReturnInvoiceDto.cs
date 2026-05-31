namespace BuildingMaterials.Application.DTOs.Invoice;

public class CreateReturnInvoiceDto
{
    public int BranchId { get; set; }
    public int RelatedInvoiceId { get; set; }
    public List<ReturnItemDto> Items { get; set; }
    public string? PaymentMethod { get; set; }
    public string? PaymentReference { get; set; }
    public string? ReturnReason { get; set; }
    public string? Notes { get; set; }
}
