namespace BuildingMaterials.Application.Extensions;

public static class DtoSanitizer
{
    public static void Sanitize<T>(T dto, string? role) where T : class
    {
        if (role != "Accountant") return;
        switch (dto)
        {
            case DTOs.Report.OwnerDashboardStatsDto dashboard:
                dashboard.MonthlyProfit = 0;
                if (dashboard.MonthlyData != null)
                    foreach (var m in dashboard.MonthlyData) m.Profit = 0;
                if (dashboard.BranchComparison != null)
                    foreach (var b in dashboard.BranchComparison) b.Profit = 0;
                break;

            case DTOs.Report.PnLReportDto pnl:
                pnl.COGS = 0;
                pnl.GrossProfit = 0;
                pnl.GrossProfitMargin = 0;
                pnl.AverageInvoiceValue = 0;
                if (pnl.MonthlyData != null)
                    foreach (var m in pnl.MonthlyData) m.Profit = 0;
                break;

            case DTOs.Report.BranchDetailedComparisonDto bc:
                bc.COGS = 0;
                bc.Profit = 0;
                bc.ProfitMargin = 0;
                break;

            case DTOs.Report.TopProductDto tp:
                tp.TotalCost = 0;
                tp.TotalProfit = 0;
                tp.ProfitMargin = 0;
                break;
        }
    }

    public static void SanitizeList<T>(IEnumerable<T> items, string? role) where T : class
    {
        if (role != "Accountant") return;
        foreach (var item in items)
            Sanitize(item, role);
    }
}
