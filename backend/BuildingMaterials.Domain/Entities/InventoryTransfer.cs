using BuildingMaterials.Domain.Entities.Base;
using BuildingMaterials.Domain.Enums;

namespace BuildingMaterials.Domain.Entities;

public class InventoryTransfer : BaseEntity
{
    public string TransferNumber { get; set; }
    public int SourceBranchId { get; set; }
    public Branch SourceBranch { get; set; }

    public int DestinationBranchId { get; set; }
    public Branch DestinationBranch { get; set; }

    public TransferStatus Status { get; set; } = TransferStatus.Pending;
    public string? Notes { get; set; }
    public new int CreatedByEmployeeId { get; set; }
    public Employee CreatedBy { get; set; }
    public int? ApprovedByEmployeeId { get; set; }
    public Employee? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }

    public ICollection<InventoryTransferItem> Items { get; set; }
}
