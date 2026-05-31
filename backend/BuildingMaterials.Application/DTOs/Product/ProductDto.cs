namespace BuildingMaterials.Application.DTOs.Product;

public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string? Barcode { get; set; }
    public string Unit { get; set; }
    public decimal? PurchasePrice { get; set; }
    public decimal MinSalePrice { get; set; }
    public decimal CurrentSalePrice { get; set; }
    public int MinStockAlert { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }
    public bool IsActive { get; set; }
}

public class CreateProductDto
{
    public string Name { get; set; }
    public string? Barcode { get; set; }
    public string Unit { get; set; }
    public decimal? PurchasePrice { get; set; }
    public decimal MinSalePrice { get; set; }
    public decimal CurrentSalePrice { get; set; }
    public int MinStockAlert { get; set; } = 10;
    public int CategoryId { get; set; }
    public List<ProductBranchQuantityDto>? InitialQuantities { get; set; }
}

public class ProductBranchQuantityDto
{
    public int BranchId { get; set; }
    public decimal Quantity { get; set; }
    public decimal AverageCost { get; set; }
}

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; }
}
