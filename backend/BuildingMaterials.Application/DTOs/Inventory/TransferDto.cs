namespace BuildingMaterials.Application.DTOs.Inventory;

public class CreateTransferDto
{
    public int SourceBranchId { get; set; }
    public int DestinationBranchId { get; set; }
    public string? Notes { get; set; }
    public List<TransferItemDto> Items { get; set; }
}

public class TransferItemDto
{
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
}

public class TransferDto
{
    public int Id { get; set; }
    public string TransferNumber { get; set; } = null!;
    public int SourceBranchId { get; set; }
    public string SourceBranchName { get; set; } = null!;
    public int DestinationBranchId { get; set; }
    public string DestinationBranchName { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = null!;
    public List<TransferItemResponseDto> Items { get; set; } = new();
}

public class TransferItemResponseDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public decimal Quantity { get; set; }
}
