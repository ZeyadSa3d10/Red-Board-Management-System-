namespace BuildingMaterials.Application.DTOs.Expense;

public class CreateExpenseDto
{
    public int BranchId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string? Notes { get; set; }
}
