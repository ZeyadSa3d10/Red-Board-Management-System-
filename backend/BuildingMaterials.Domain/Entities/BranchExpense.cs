using BuildingMaterials.Domain.Entities.Base;

namespace BuildingMaterials.Domain.Entities;

public class BranchExpense : BaseEntity
{
    public int BranchId { get; set; }
    public Branch Branch { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string? Notes { get; set; }
    public new int CreatedByEmployeeId { get; set; }
    public Employee CreatedBy { get; set; }
}
