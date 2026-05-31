namespace BuildingMaterials.Application.DTOs.Purchase;

public class CreatePurchaseInvoiceDto
{
    public int SupplierId { get; set; }
    public int BranchId { get; set; }
    public DateTime InvoiceDate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TransportCost { get; set; } = 0;
    public decimal PaidNow { get; set; } = 0;
    public string? PaymentMethod { get; set; }
    public string? CheckNumber { get; set; }
    public string? ProjectName { get; set; }
    public string? Notes { get; set; }
    public List<PurchaseItemDto> Items { get; set; }
}

public class PurchaseItemDto
{
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }
}

public class PurchaseInvoiceResponseDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; }
    public string SupplierName { get; set; }
    public string BranchName { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TransportCost { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public DateTime InvoiceDate { get; set; }
    public string AddedByName { get; set; }
    public string PaymentMethod { get; set; }
    public string? ProjectName { get; set; }
    public List<PurchaseItemResponseDto> Items { get; set; }
}

public class PurchaseItemResponseDto
{
    public string ProductName { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal TotalCost { get; set; }
}
