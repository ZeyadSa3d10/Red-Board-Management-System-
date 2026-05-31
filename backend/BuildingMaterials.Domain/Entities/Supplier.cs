using BuildingMaterials.Domain.Entities.Base;

namespace BuildingMaterials.Domain.Entities;

public class Supplier : BaseEntity
{
    public string Name { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }

    public decimal TotalPurchases { get; set; } = 0;
    public decimal TotalPaid { get; set; } = 0;
    public decimal TotalDue { get; set; } = 0;

    public ICollection<PurchaseInvoice> PurchaseInvoices { get; set; }
}
