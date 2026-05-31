using BuildingMaterials.Domain.Entities.Base;
using BuildingMaterials.Domain.Enums;

namespace BuildingMaterials.Domain.Entities;

public class SalaryPayment : BaseEntity
{
    public int EmployeeId { get; set; }
    public Employee Employee { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public DateTime PaidDate { get; set; }
    public int PaidByEmployeeId { get; set; }
    public int PaidById { get; set; }
    public Employee PaidBy { get; set; }
    public string? Notes { get; set; }
}
