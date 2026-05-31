namespace BuildingMaterials.Application.DTOs.Invoice;

public class CreateDeferredInvoiceDto
{
    public int BranchId { get; set; }
    public int ClientId { get; set; }
    public List<InvoiceItemDto> Items { get; set; }
    public decimal Discount { get; set; } = 0;
    public decimal TransportCost { get; set; } = 0;
    public DateTime? DueDate { get; set; }
    public string? Notes { get; set; }
}
