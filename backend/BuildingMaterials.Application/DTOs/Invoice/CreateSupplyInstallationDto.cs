namespace BuildingMaterials.Application.DTOs.Invoice;

public class CreateSupplyInstallationDto
{
    public int BranchId { get; set; }
    public string ProjectName { get; set; }
    public List<SupplyInstallationItemDto> Items { get; set; }
    public string? Notes { get; set; }
}

public class SupplyInstallationItemDto
{
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
}
