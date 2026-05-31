namespace BuildingMaterials.Application.DTOs.Supplier;

public class SupplierDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public decimal TotalPurchases { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal TotalDue { get; set; }
}

public class CreateSupplierDto
{
    public string Name { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public int? CategoryId { get; set; }
}

public class UpdateSupplierDto
{
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public int? CategoryId { get; set; }
}

public class SupplierIndependentPaymentDto
{
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? CheckNumber { get; set; }
    public string? Notes { get; set; }
}

public class SupplierStatementDto
{
    public int SupplierId { get; set; }
    public string SupplierName { get; set; }
    public List<SupplierStatementItem> Items { get; set; }
}
public class SupplierStatementItem
{
    public DateTime Date { get; set; }
    public string Description { get; set; }
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
    public decimal Balance { get; set; }
}

public class SupplierPaymentDto
{
    public int PurchaseInvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? CheckNumber { get; set; }
    public string? Notes { get; set; }
}
