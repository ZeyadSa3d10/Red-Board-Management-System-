using BuildingMaterials.Domain.Entities.Base;
using BuildingMaterials.Domain.Enums;

namespace BuildingMaterials.Domain.Entities;

public class SupplierPayment : BaseEntity
{
    public int SupplierId { get; set; }
    public Supplier Supplier { get; set; }

    public int? PurchaseInvoiceId { get; set; }
    public PurchaseInvoice? PurchaseInvoice { get; set; }

    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? CheckNumber { get; set; }
    public int PaidByEmployeeId { get; set; }
    public int PaidById { get; set; }
    public Employee PaidBy { get; set; }
    public string? Notes { get; set; }
}
