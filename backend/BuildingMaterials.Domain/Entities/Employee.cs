using BuildingMaterials.Domain.Entities.Base;
using BuildingMaterials.Domain.Enums;

namespace BuildingMaterials.Domain.Entities;

public class Employee : BaseEntity
{
    public string FullName { get; set; }
    public string Phone { get; set; }
    public string PasswordHash { get; set; }
    public string NationalId { get; set; }
    public EmployeeRole Role { get; set; }
    public SalaryType SalaryType { get; set; } = SalaryType.Monthly;
    public decimal? Salary { get; set; }
    public DateTime JoinDate { get; set; }
    public bool IsActive { get; set; } = true;

    public int? BranchId { get; set; }
    public Branch? Branch { get; set; }
    public ICollection<SalaryPayment> SalaryPayments { get; set; }
}
