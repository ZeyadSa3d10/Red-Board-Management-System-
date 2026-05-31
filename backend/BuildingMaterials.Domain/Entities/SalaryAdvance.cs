using BuildingMaterials.Domain.Entities.Base;

namespace BuildingMaterials.Domain.Entities;

public class SalaryAdvance : BaseEntity
{
    public int EmployeeId { get; set; }
    public Employee Employee { get; set; }
    public decimal Amount { get; set; }
    public DateTime AdvanceDate { get; set; }
    public string? Notes { get; set; }
    public bool IsDeducted { get; set; } = false;
}
