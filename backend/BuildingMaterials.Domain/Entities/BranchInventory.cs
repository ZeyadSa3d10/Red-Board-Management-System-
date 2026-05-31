using BuildingMaterials.Domain.Entities.Base;

namespace BuildingMaterials.Domain.Entities;

public class BranchInventory : BaseEntity
{
    public int ProductId { get; set; }
    public Product Product { get; set; }

    public int BranchId { get; set; }
    public Branch Branch { get; set; }

    public decimal Quantity { get; set; }
    public decimal AverageCost { get; set; }
}
