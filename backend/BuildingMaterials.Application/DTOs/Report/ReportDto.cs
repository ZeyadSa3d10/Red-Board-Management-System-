namespace BuildingMaterials.Application.DTOs.Report;

public class OwnerDashboardStatsDto
{
    public decimal TotalInventoryValue { get; set; }
    public decimal TotalDeferredFromClients { get; set; }
    public decimal TotalDueToSuppliers { get; set; }
    public int TotalInvoicesCount { get; set; }
    public decimal MonthlyRevenue { get; set; }
    public decimal MonthlyProfit { get; set; }
    public List<MonthlyRevenueDto> MonthlyData { get; set; } = null!;
    public List<BranchComparisonDto> BranchComparison { get; set; } = null!;
}

public class MonthlyRevenueDto
{
    public string Month { get; set; } = null!;
    public int Year { get; set; }
    public decimal Revenue { get; set; }
    public decimal Profit { get; set; }
}

public class RevenueByPaymentDto
{
    public DateTime DateFrom { get; set; }
    public DateTime DateTo { get; set; }
    public decimal CashRevenue { get; set; }
    public decimal VodafoneCashRevenue { get; set; }
    public decimal CheckRevenue { get; set; }
    public decimal DeferredCollected { get; set; }
    public decimal TotalRevenue { get; set; }
}
public class MonthlyBranchReportDto
{
    public int BranchId { get; set; }
    public string BranchName { get; set; } = null!;
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal TotalSales { get; set; }
    public decimal TotalReturns { get; set; }
    public decimal DeferredPayments { get; set; }
    public decimal NetRevenue { get; set; }
    public decimal CashAmount { get; set; }
    public decimal VodafoneCashAmount { get; set; }
    public decimal CheckAmount { get; set; }
    public int InvoicesCount { get; set; }
}
public class TopProductDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? Barcode { get; set; }
    public int TotalQuantity { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalCost { get; set; }
    public decimal TotalProfit { get; set; }
    public decimal ProfitMargin { get; set; }
}
public class SalarySummaryDto
{
    public DateTime DateFrom { get; set; }
    public DateTime DateTo { get; set; }
    public decimal TotalSalaries { get; set; }
    public decimal TotalAdvances { get; set; }
    public int EmployeeCount { get; set; }
    public List<SalarySummaryItemDto> Items { get; set; } = null!;
}
public class SalarySummaryItemDto
{
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = null!;
    public decimal SalaryAmount { get; set; }
    public DateTime PaidDate { get; set; }
}

public class BranchComparisonDto
{
    public int BranchId { get; set; }
    public string BranchName { get; set; } = null!;
    public decimal Revenue { get; set; }
    public decimal Profit { get; set; }
    public int InvoicesCount { get; set; }
}

public class PnLReportDto
{
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalReturns { get; set; }
    public decimal NetRevenue { get; set; }
    public decimal COGS { get; set; }
    public decimal GrossProfit { get; set; }
    public decimal GrossProfitMargin { get; set; }
    public int InvoicesCount { get; set; }
    public decimal AverageInvoiceValue { get; set; }
    public List<MonthlyRevenueDto> MonthlyData { get; set; } = null!;
}

public class DailyBranchRevenueDto
{
    public int BranchId { get; set; }
    public string BranchName { get; set; } = null!;
    public decimal CashAmount { get; set; }
    public decimal VodafoneCashAmount { get; set; }
    public decimal CheckAmount { get; set; }
    public decimal DeferredSales { get; set; }
    public decimal DeferredCollected { get; set; }
    public decimal Returns { get; set; }
    public decimal NetRevenue { get; set; }
    public int InvoicesCount { get; set; }
}
public class BranchDetailedComparisonDto
{
    public int BranchId { get; set; }
    public string BranchName { get; set; } = null!;
    public decimal Revenue { get; set; }
    public decimal Returns { get; set; }
    public decimal NetRevenue { get; set; }
    public decimal COGS { get; set; }
    public decimal Profit { get; set; }
    public decimal ProfitMargin { get; set; }
    public int InvoicesCount { get; set; }
}

public class InventoryValueDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? Barcode { get; set; }
    public string Unit { get; set; } = null!;
    public Dictionary<string, decimal> QuantityPerBranch { get; set; } = null!;
    public decimal TotalQuantity { get; set; }
    public decimal AverageCost { get; set; }
    public decimal TotalValue { get; set; }
    public bool IsLowStock { get; set; }
    public int MinStockAlert { get; set; }
}

public class DeferredAgingReportDto
{
    public decimal TotalDeferred { get; set; }
    public int ClientsWithDebt { get; set; }
    public List<ClientAgingDto> Clients { get; set; } = null!;
}

public class ClientAgingDto
{
    public int ClientId { get; set; }
    public string ClientName { get; set; } = null!;
    public decimal TotalDebt { get; set; }
    public decimal CreditLimit { get; set; }
    public decimal CreditUsagePercent { get; set; }
    public decimal Days0to30 { get; set; }
    public decimal Days31to60 { get; set; }
    public decimal Days61to90 { get; set; }
    public decimal DaysOver90 { get; set; }
    public DateTime? OldestInvoiceDate { get; set; }
}

public class DeferredCollectionDto
{
    public DateTime Date { get; set; }
    public string ClientName { get; set; } = null!;
    public string BranchName { get; set; } = null!;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = null!;
}

public class LedgerEntryDto
{
    public DateTime Date { get; set; }
    public string Description { get; set; } = null!;
    public string BranchName { get; set; } = null!;
    public string Type { get; set; } = null!;
    public string? PaymentMethod { get; set; }
    public decimal? InAmount { get; set; }
    public decimal? OutAmount { get; set; }
    public string? ReferenceNumber { get; set; }
}

public class LedgerResponseDto
{
    public decimal TotalIn { get; set; }
    public decimal TotalOut { get; set; }
    public decimal NetAmount { get; set; }
    public List<LedgerEntryDto> Entries { get; set; } = null!;
}
