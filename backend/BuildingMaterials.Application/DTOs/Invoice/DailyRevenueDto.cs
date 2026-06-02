namespace BuildingMaterials.Application.DTOs.Invoice;

public class DailyRevenueDto
{
    public DateTime Date { get; set; }
    public int BranchId { get; set; }
    public decimal TotalSales { get; set; }
    public decimal TotalReturns { get; set; }
    public decimal DeferredPayments { get; set; }
    public decimal NetRevenue { get; set; }
    public int InvoicesCount { get; set; }
    public decimal CashAmount { get; set; }
    public decimal VodafoneCashAmount { get; set; }
    public decimal CheckAmount { get; set; }
    public decimal BankTransferAmount { get; set; }
}
