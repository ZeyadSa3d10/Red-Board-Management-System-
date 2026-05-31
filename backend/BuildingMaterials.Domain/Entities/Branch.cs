using BuildingMaterials.Domain.Entities.Base;

namespace BuildingMaterials.Domain.Entities;

public class Branch : BaseEntity
{
    public string Name { get; set; }
    public string Location { get; set; }
    public string Phone { get; set; }
    public bool IsAdminBranch { get; set; } = false;
    public bool IsActive { get; set; } = true;

    public int? ManagerEmployeeId { get; set; }
    public Employee? Manager { get; set; }
    public ICollection<Employee> Employees { get; set; }
    public ICollection<BranchInventory> Inventory { get; set; }
    public ICollection<Invoice> Invoices { get; set; }
}
