using BuildingMaterials.Domain.Enums;

namespace BuildingMaterials.Application.DTOs.Invoice;

public class CreateSaleInvoiceDto
{
    public int BranchId { get; set; }
    public int? ClientId { get; set; }
    public string? WalkInClientName { get; set; }
    public List<InvoiceItemDto> Items { get; set; }
    public decimal Discount { get; set; } = 0;
    public decimal TransportCost { get; set; } = 0;
    public PaymentMethod PaymentMethod { get; set; }
    public string? PaymentReference { get; set; }
    public string? Notes { get; set; }
}
