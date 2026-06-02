using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Invoice;
using BuildingMaterials.Application.DTOs.Report;

namespace BuildingMaterials.Application.Services.Interfaces;

public interface IReportService
{
    Task<IEnumerable<InvoiceListDto>> GetAllInvoicesAsync(InvoiceFilterDto filter);
    Task<OwnerDashboardStatsDto> GetOwnerDashboardStatsAsync(DateTime? dateFrom = null, DateTime? dateTo = null);
    Task<RevenueByPaymentDto> GetRevenueByPaymentAsync(DateTime dateFrom, DateTime dateTo);
    Task<MonthlyBranchReportDto> GetBranchMonthlyReportAsync(int branchId, int month, int year);
    Task<IEnumerable<TopProductDto>> GetTopProductsAsync(int count);
    Task<SalarySummaryDto> GetSalarySummaryAsync(DateTime dateFrom, DateTime dateTo);
    Task<PnLReportDto> GetPnLAsync(DateTime? dateFrom, DateTime? dateTo, int? branchId);
    Task<IEnumerable<DailyBranchRevenueDto>> GetDailyAllBranchesAsync(DateTime date);
    Task<IEnumerable<BranchDetailedComparisonDto>> GetBranchComparisonAsync(DateTime? dateFrom, DateTime? dateTo);
    Task<IEnumerable<TopProductDto>> GetTopProductsFilteredAsync(DateTime? dateFrom, DateTime? dateTo, int? branchId, int limit, string sortBy);
    Task<IEnumerable<InventoryValueDto>> GetInventoryValueAsync();
    Task<DeferredAgingReportDto> GetDeferredAgingAsync();
    Task<IEnumerable<DeferredCollectionDto>> GetDeferredCollectionsAsync(DateTime dateFrom, DateTime dateTo);
    Task<SalarySummaryDto> GetSalarySummaryDetailedAsync(int? month, int? year, int? branchId);
    Task<LedgerResponseDto> GetLedgerAsync(DateTime? dateFrom, DateTime? dateTo, int? branchId);
    Task<PagedResult<LedgerEntryDto>> GetLedgerPagedAsync(LedgerFilterDto filter);
    Task<SalesStatsDto> GetSalesStatsAsync(DateTime? dateFrom, DateTime? dateTo, int? branchId, int? type);
}
