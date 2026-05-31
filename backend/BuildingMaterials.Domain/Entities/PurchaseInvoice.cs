using BuildingMaterials.Domain.Entities.Base;

namespace BuildingMaterials.Domain.Entities;

public class PurchaseInvoice : BaseEntity
{
    public string InvoiceNumber { get; set; }
    public int SupplierId { get; set; }
    public Supplier Supplier { get; set; }

    public int BranchId { get; set; }
    public Branch Branch { get; set; }

    public decimal TotalAmount { get; set; }
    public decimal TransportCost { get; set; } = 0;
    public decimal PaidAmount { get; set; } = 0;
    public decimal RemainingAmount { get; set; }

    public DateTime InvoiceDate { get; set; }
    public string? ProjectName { get; set; }
    public string? Notes { get; set; }
    public int AddedByEmployeeId { get; set; }
    public int AddedById { get; set; }
    public Employee AddedBy { get; set; }

    public ICollection<PurchaseInvoiceItem> Items { get; set; } = new List<PurchaseInvoiceItem>();
    public ICollection<SupplierPayment> Payments { get; set; } = new List<SupplierPayment>();
}
