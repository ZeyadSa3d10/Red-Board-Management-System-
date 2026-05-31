namespace BuildingMaterials.Application.DTOs.Invoice;

public class InvoiceItemDto
{
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public class ReturnItemDto
{
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
}

public class ProjectIssueItemDto
{
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
}
