namespace BuildingMaterials.Application.DTOs.Invoice;

public class InvoiceResponseDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; }
    public string Type { get; set; }
    public string BranchName { get; set; }
    public string? ClientName { get; set; }
    public List<InvoiceItemResponseDto> Items { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal TransportCost { get; set; }
    public decimal TotalAmount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? PaymentReference { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Status { get; set; }
    public string? ReturnReason { get; set; }
    public string? ProjectName { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
}

public class InvoiceItemResponseDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; }
    public decimal Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public decimal? TotalPrice { get; set; }
}
