namespace BuildingMaterials.Application.DTOs.Inventory;

public class InventoryDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string Barcode { get; set; } = null!;
    public int BranchId { get; set; }
    public string BranchName { get; set; } = null!;
    public decimal Quantity { get; set; }
    public decimal AverageCost { get; set; }
}

public class InventoryMatrixDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string Barcode { get; set; } = null!;
    public string Unit { get; set; } = null!;
    public decimal? PurchasePrice { get; set; }
    public decimal SalePrice { get; set; }
    public int MinStockAlert { get; set; }
    public int TotalQuantity { get; set; }
    public List<BranchStockDto> BranchStocks { get; set; } = null!;
}
public class BranchStockDto
{
    public int BranchId { get; set; }
    public string BranchName { get; set; } = null!;
    public decimal Quantity { get; set; }
    public decimal AverageCost { get; set; }
}

public class LowStockCountDto
{
    public int Count { get; set; }
}

public class LowStockDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public int BranchId { get; set; }
    public string BranchName { get; set; } = null!;
    public decimal Quantity { get; set; }
    public int MinStockAlert { get; set; }
}
