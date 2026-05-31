using BuildingMaterials.Domain.Entities.Base;

namespace BuildingMaterials.Domain.Entities;

public class InventoryTransferItem : BaseEntity
{
    public int TransferId { get; set; }
    public InventoryTransfer Transfer { get; set; }
    public int ProductId { get; set; }
    public Product Product { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }
}
