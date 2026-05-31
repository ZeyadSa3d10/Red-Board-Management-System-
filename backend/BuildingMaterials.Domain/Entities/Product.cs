using BuildingMaterials.Domain.Entities.Base;

namespace BuildingMaterials.Domain.Entities;

public class Product : BaseEntity
{
    public string Name { get; set; }
    public string? Barcode { get; set; }
    public string Unit { get; set; }
    public decimal? PurchasePrice { get; set; }
    public decimal MinSalePrice { get; set; }
    public decimal CurrentSalePrice { get; set; }
    public int MinStockAlert { get; set; }
    public bool IsActive { get; set; } = true;

    public int CategoryId { get; set; }
    public Category Category { get; set; }
    public ICollection<BranchInventory> BranchInventories { get; set; }
    public ICollection<InvoiceItem> InvoiceItems { get; set; }
    public ICollection<PurchaseInvoiceItem> PurchaseItems { get; set; }
}
