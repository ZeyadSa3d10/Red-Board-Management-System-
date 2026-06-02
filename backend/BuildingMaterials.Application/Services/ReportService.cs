using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Invoice;
using BuildingMaterials.Application.DTOs.Report;
using BuildingMaterials.Application.Services.Interfaces;
using BuildingMaterials.Domain.Entities;
using BuildingMaterials.Domain.Enums;
using BuildingMaterials.Domain.Exceptions;
using BuildingMaterials.Infrastructure.Data;
using BuildingMaterials.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;
using AutoMapper;

namespace BuildingMaterials.Application.Services;

public class ReportService : IReportService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public ReportService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<OwnerDashboardStatsDto> GetOwnerDashboardStatsAsync(DateTime? dateFrom = null, DateTime? dateTo = null)
    {
        var now = DateTime.Now;
        var start = dateFrom?.Date ?? new DateTime(now.Year, now.Month, 1);
        var end = dateTo?.Date.AddDays(1) ?? start.AddMonths(1);

        var inventoryValue = await _context.BranchInventories
            .SumAsync(x => x.Quantity * x.AverageCost);

        var totalDeferred = await _context.Clients.SumAsync(x => x.TotalDeferred);

        var totalDueSuppliers = await _context.Suppliers.SumAsync(x => x.TotalDue);

        var filteredRevenue = await _context.Invoices
            .Where(x => (x.Type == InvoiceType.Sale || x.Type == InvoiceType.SaleDeferred) && x.CreatedAt >= start && x.CreatedAt < end)
            .SumAsync(x => x.TotalAmount);

        var filteredReturns = await _context.Invoices
            .Where(x => (x.Type == InvoiceType.ReturnSale || x.Type == InvoiceType.ReturnDeferred) && x.CreatedAt >= start && x.CreatedAt < end)
            .SumAsync(x => x.TotalAmount);

        var filteredCOGS = await _context.InvoiceItems
            .Where(x => (x.Invoice.Type == InvoiceType.Sale || x.Invoice.Type == InvoiceType.SaleDeferred)
                     && x.Invoice.CreatedAt >= start && x.Invoice.CreatedAt < end)
            .SumAsync(x => x.Quantity * x.CostAtTime);

        var filteredInvoices = await _context.Invoices
            .CountAsync(x => !x.IsCancelled && x.CreatedAt >= start && x.CreatedAt < end);

        var netRevenue = filteredRevenue - filteredReturns;
        var netProfit = netRevenue - filteredCOGS;

        var sixMonthsAgo = now.AddMonths(-5);
        var sixMonthsAgoStart = new DateTime(sixMonthsAgo.Year, sixMonthsAgo.Month, 1);

        var monthlyInvoices = await _context.Invoices
            .Where(x => x.CreatedAt >= sixMonthsAgoStart && x.CreatedAt < end)
            .Select(x => new { x.Type, x.CreatedAt, x.TotalAmount })
            .ToListAsync();

        var monthlyCosts = await _context.InvoiceItems
            .Where(x => (x.Invoice.Type == InvoiceType.Sale || x.Invoice.Type == InvoiceType.SaleDeferred)
                     && x.Invoice.CreatedAt >= sixMonthsAgoStart && x.Invoice.CreatedAt < end)
            .Select(x => new { x.Invoice.CreatedAt, Cost = x.Quantity * x.CostAtTime })
            .ToListAsync();

        var monthlyRevenue = new List<MonthlyRevenueDto>();
        for (int i = 5; i >= 0; i--)
        {
            var monthDate = now.AddMonths(-i);
            var ms = new DateTime(monthDate.Year, monthDate.Month, 1);
            var me = ms.AddMonths(1);

            var rev = monthlyInvoices
                .Where(x => (x.Type == InvoiceType.Sale || x.Type == InvoiceType.SaleDeferred) && x.CreatedAt >= ms && x.CreatedAt < me)
                .Sum(x => x.TotalAmount);

            var ret = monthlyInvoices
                .Where(x => (x.Type == InvoiceType.ReturnSale || x.Type == InvoiceType.ReturnDeferred) && x.CreatedAt >= ms && x.CreatedAt < me)
                .Sum(x => x.TotalAmount);

            var c = monthlyCosts
                .Where(x => x.CreatedAt >= ms && x.CreatedAt < me)
                .Sum(x => x.Cost);

            monthlyRevenue.Add(new MonthlyRevenueDto
            {
                Month = monthDate.ToString("MMMM", new System.Globalization.CultureInfo("ar")),
                Year = monthDate.Year,
                Revenue = rev - ret,
                Profit = (rev - ret) - c
            });
        }

        var branchComparison = await _context.Branches
            .Where(x => !x.IsAdminBranch)
            .Select(b => new BranchComparisonDto
            {
                BranchName = b.Name,
                BranchId = b.Id,
                Revenue = b.Invoices
                    .Where(x => (x.Type == InvoiceType.Sale || x.Type == InvoiceType.SaleDeferred) && x.CreatedAt >= start && x.CreatedAt < end)
                    .Sum(x => (decimal?)x.TotalAmount) ?? 0,
                Profit = b.Invoices
                    .Where(x => (x.Type == InvoiceType.Sale || x.Type == InvoiceType.SaleDeferred) && x.CreatedAt >= start && x.CreatedAt < end)
                    .SelectMany(x => x.Items)
                    .Sum(x => (decimal?)(x.TotalPrice - (x.Quantity * x.CostAtTime))) ?? 0,
                InvoicesCount = b.Invoices
                    .Count(x => !x.IsCancelled && x.CreatedAt >= start && x.CreatedAt < end)
            })
            .ToListAsync();

        return new OwnerDashboardStatsDto
        {
            TotalInventoryValue = inventoryValue,
            TotalDeferredFromClients = totalDeferred,
            TotalDueToSuppliers = totalDueSuppliers,
            TotalInvoicesCount = filteredInvoices,
            MonthlyRevenue = netRevenue,
            MonthlyProfit = netProfit,
            MonthlyData = monthlyRevenue,
            BranchComparison = branchComparison,
        };
    }

    public async Task<SalesStatsDto> GetSalesStatsAsync(DateTime? dateFrom, DateTime? dateTo, int? branchId, int? type)
    {
        var query = _context.Invoices
            .Where(x => !x.IsCancelled)
            .AsQueryable()
            .ApplyWhereIf(dateFrom.HasValue, x => x.CreatedAt >= dateFrom!.Value)
            .ApplyWhereIf(dateTo.HasValue, x => x.CreatedAt <= dateTo!.Value.Date.AddDays(1))
            .ApplyWhereIf(branchId.HasValue, x => x.BranchId == branchId!.Value)
            .ApplyWhereIf(type.HasValue, x => x.Type == (InvoiceType)type!.Value);

        var salesTypes = new[] { InvoiceType.Sale, InvoiceType.SaleDeferred, InvoiceType.SupplyAndInstallation };
        var returnTypes = new[] { InvoiceType.ReturnSale, InvoiceType.ReturnDeferred, InvoiceType.ReturnSupplyAndInstallation };

        var totalSales = await query.Where(x => salesTypes.Contains(x.Type)).SumAsync(x => x.TotalAmount);
        var totalReturns = await query.Where(x => returnTypes.Contains(x.Type)).SumAsync(x => x.TotalAmount);
        var totalDeferred = await query.Where(x => x.Type == InvoiceType.SaleDeferred).SumAsync(x => x.TotalAmount);

        return new SalesStatsDto
        {
            TotalSales = totalSales,
            TotalReturns = totalReturns,
            TotalDeferred = totalDeferred,
            NetSales = totalSales - totalReturns - totalDeferred
        };
    }

    public async Task<RevenueByPaymentDto> GetRevenueByPaymentAsync(DateTime dateFrom, DateTime dateTo)
    {
        var endDate = dateTo.AddDays(1);

        var saleInvoices = await _context.Invoices
            .Where(x => x.Type == InvoiceType.Sale
                     && x.CreatedAt >= dateFrom
                     && x.CreatedAt < endDate)
            .ToListAsync();

        var deferredCollected = await _context.ClientPayments
            .Where(x => x.PaymentDate >= dateFrom && x.PaymentDate < endDate)
            .SumAsync(x => x.Amount);

        return new RevenueByPaymentDto
        {
            DateFrom = dateFrom,
            DateTo = dateTo,
            CashRevenue = saleInvoices.Where(x => x.PaymentMethod == PaymentMethod.Cash).Sum(x => x.TotalAmount),
            VodafoneCashRevenue = saleInvoices.Where(x => x.PaymentMethod == PaymentMethod.VodafoneCash).Sum(x => x.TotalAmount),
            CheckRevenue = saleInvoices.Where(x => x.PaymentMethod == PaymentMethod.Check).Sum(x => x.TotalAmount),
            DeferredCollected = deferredCollected,
            TotalRevenue = saleInvoices.Sum(x => x.TotalAmount) + deferredCollected
        };
    }

    public async Task<MonthlyBranchReportDto> GetBranchMonthlyReportAsync(int branchId, int month, int year)
    {
        var branch = await _context.Branches.FindAsync(branchId)
            ?? throw new NotFoundException("الفرع غير موجود");

        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1);

        var saleInvoices = await _context.Invoices
            .Where(x => x.BranchId == branchId
                     && x.Type == InvoiceType.Sale
                     && x.CreatedAt >= startDate
                     && x.CreatedAt < endDate)
            .ToListAsync();

        var returnInvoices = await _context.Invoices
            .Where(x => x.BranchId == branchId
                     && x.Type == InvoiceType.ReturnSale
                     && x.CreatedAt >= startDate
                     && x.CreatedAt < endDate)
            .ToListAsync();

        var deferredPayments = await _context.ClientPayments
            .Where(x => x.BranchId == branchId
                     && x.PaymentDate >= startDate
                     && x.PaymentDate < endDate)
            .SumAsync(x => x.Amount);

        var totalSales = saleInvoices.Sum(x => x.TotalAmount);
        var totalReturns = returnInvoices.Sum(x => x.TotalAmount);

        return new MonthlyBranchReportDto
        {
            BranchId = branchId,
            BranchName = branch.Name,
            Month = month,
            Year = year,
            TotalSales = totalSales,
            TotalReturns = totalReturns,
            DeferredPayments = deferredPayments,
            NetRevenue = totalSales - totalReturns + deferredPayments,
            CashAmount = saleInvoices.Where(x => x.PaymentMethod == PaymentMethod.Cash).Sum(x => x.TotalAmount),
            VodafoneCashAmount = saleInvoices.Where(x => x.PaymentMethod == PaymentMethod.VodafoneCash).Sum(x => x.TotalAmount),
            CheckAmount = saleInvoices.Where(x => x.PaymentMethod == PaymentMethod.Check).Sum(x => x.TotalAmount),
            InvoicesCount = saleInvoices.Count
        };
    }

    public async Task<IEnumerable<TopProductDto>> GetTopProductsAsync(int count)
    {
        var items = await _context.InvoiceItems
            .Include(x => x.Invoice)
            .Include(x => x.Product)
            .Where(x => x.Invoice.Type == InvoiceType.Sale)
            .GroupBy(x => new { x.ProductId, x.Product.Name, x.Product.Barcode })
            .Select(g => new TopProductDto
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.Name,
                Barcode = g.Key.Barcode,
                TotalQuantity = (int)g.Sum(x => x.Quantity),
                TotalRevenue = g.Sum(x => x.TotalPrice ?? 0),
                TotalCost = g.Sum(x => x.Quantity * x.CostAtTime),
                TotalProfit = g.Sum(x => x.TotalPrice ?? 0) - g.Sum(x => x.Quantity * x.CostAtTime)
            })
            .OrderByDescending(x => x.TotalRevenue)
            .Take(count)
            .ToListAsync();

        foreach (var item in items)
        {
            item.ProfitMargin = item.TotalRevenue > 0
                ? Math.Round((item.TotalProfit / item.TotalRevenue) * 100, 2)
                : 0;
        }

        return items;
    }

    public async Task<SalarySummaryDto> GetSalarySummaryAsync(DateTime dateFrom, DateTime dateTo)
    {
        var endDate = dateTo.AddDays(1);

        var payments = await _context.SalaryPayments
            .Include(x => x.Employee)
            .Where(x => x.PaidDate >= dateFrom && x.PaidDate < endDate)
            .ToListAsync();

        var advances = await _context.SalaryAdvances
            .Where(x => x.AdvanceDate >= dateFrom && x.AdvanceDate < endDate)
            .SumAsync(x => x.Amount);

        return new SalarySummaryDto
        {
            DateFrom = dateFrom,
            DateTo = dateTo,
            TotalSalaries = payments.Sum(x => x.Amount),
            TotalAdvances = advances,
            EmployeeCount = payments.Select(x => x.EmployeeId).Distinct().Count(),
            Items = payments.Select(x => new SalarySummaryItemDto
            {
                EmployeeId = x.EmployeeId,
                EmployeeName = x.Employee.FullName,
                SalaryAmount = x.Amount,
                PaidDate = x.PaidDate
            }).ToList()
        };
    }

    public async Task<PnLReportDto> GetPnLAsync(DateTime? dateFrom, DateTime? dateTo, int? branchId)
    {
        var now = DateTime.Now;
        var start = dateFrom ?? new DateTime(now.Year, now.Month, 1);
        var end = dateTo ?? start.AddMonths(1);
        var endDate = end.Date.AddDays(1);

        var invoiceQuery = _context.Invoices.AsQueryable();
        if (branchId.HasValue)
            invoiceQuery = invoiceQuery.Where(x => x.BranchId == branchId.Value);

        var saleInvoices = await invoiceQuery
            .Where(x => (x.Type == InvoiceType.Sale || x.Type == InvoiceType.SaleDeferred) && x.CreatedAt >= start && x.CreatedAt < endDate)
            .ToListAsync();

        var returnInvoices = await invoiceQuery
            .Where(x => (x.Type == InvoiceType.ReturnSale || x.Type == InvoiceType.ReturnDeferred) && x.CreatedAt >= start && x.CreatedAt < endDate)
            .ToListAsync();

        var totalRevenue = saleInvoices.Sum(x => x.TotalAmount);
        var totalReturns = returnInvoices.Sum(x => x.TotalAmount);
        var netRevenue = totalRevenue - totalReturns;

        var itemQuery = _context.InvoiceItems.Include(x => x.Invoice).AsQueryable();
        if (branchId.HasValue)
            itemQuery = itemQuery.Where(x => x.Invoice.BranchId == branchId.Value);

        var cogs = await itemQuery
            .Where(x => (x.Invoice.Type == InvoiceType.Sale || x.Invoice.Type == InvoiceType.SaleDeferred) && x.Invoice.CreatedAt >= start && x.Invoice.CreatedAt < endDate)
            .SumAsync(x => x.Quantity * x.CostAtTime);

        var grossProfit = netRevenue - cogs;
        var margin = netRevenue > 0 ? Math.Round((grossProfit / netRevenue) * 100, 2) : 0;
        var invoicesCount = saleInvoices.Count;

        var sixMonthsAgo = now.AddMonths(-5);
        var sixMonthsAgoStart = new DateTime(sixMonthsAgo.Year, sixMonthsAgo.Month, 1);

        var pnlInvoicesQuery = _context.Invoices
            .Where(x => x.CreatedAt >= sixMonthsAgoStart && x.CreatedAt < endDate);
        if (branchId.HasValue)
            pnlInvoicesQuery = pnlInvoicesQuery.Where(x => x.BranchId == branchId.Value);

        var pnlInvoices = await pnlInvoicesQuery
            .Select(x => new { x.Type, x.CreatedAt, x.TotalAmount })
            .ToListAsync();

        var pnlCostsQuery = _context.InvoiceItems
            .Where(x => (x.Invoice.Type == InvoiceType.Sale || x.Invoice.Type == InvoiceType.SaleDeferred)
                     && x.Invoice.CreatedAt >= sixMonthsAgoStart && x.Invoice.CreatedAt < endDate);
        if (branchId.HasValue)
            pnlCostsQuery = pnlCostsQuery.Where(x => x.Invoice.BranchId == branchId.Value);

        var pnlCosts = await pnlCostsQuery
            .Select(x => new { x.Invoice.CreatedAt, Cost = x.Quantity * x.CostAtTime })
            .ToListAsync();

        var monthlyData = new List<MonthlyRevenueDto>();
        for (int i = 5; i >= 0; i--)
        {
            var monthDate = now.AddMonths(-i);
            var ms = new DateTime(monthDate.Year, monthDate.Month, 1);
            var me = ms.AddMonths(1);

            var mRev = pnlInvoices
                .Where(x => (x.Type == InvoiceType.Sale || x.Type == InvoiceType.SaleDeferred) && x.CreatedAt >= ms && x.CreatedAt < me)
                .Sum(x => x.TotalAmount);
            var mRet = pnlInvoices
                .Where(x => (x.Type == InvoiceType.ReturnSale || x.Type == InvoiceType.ReturnDeferred) && x.CreatedAt >= ms && x.CreatedAt < me)
                .Sum(x => x.TotalAmount);
            var mCogs = pnlCosts
                .Where(x => x.CreatedAt >= ms && x.CreatedAt < me)
                .Sum(x => x.Cost);

            monthlyData.Add(new MonthlyRevenueDto
            {
                Month = monthDate.ToString("MMMM", new System.Globalization.CultureInfo("ar")),
                Year = monthDate.Year,
                Revenue = mRev - mRet,
                Profit = (mRev - mRet) - mCogs
            });
        }

        return new PnLReportDto
        {
            DateFrom = start,
            DateTo = end,
            TotalRevenue = totalRevenue,
            TotalReturns = totalReturns,
            NetRevenue = netRevenue,
            COGS = cogs,
            GrossProfit = grossProfit,
            GrossProfitMargin = margin,
            InvoicesCount = invoicesCount,
            AverageInvoiceValue = invoicesCount > 0 ? netRevenue / invoicesCount : 0,
            MonthlyData = monthlyData
        };
    }

    public async Task<IEnumerable<DailyBranchRevenueDto>> GetDailyAllBranchesAsync(DateTime date)
    {
        var branches = await _context.Branches.Where(x => !x.IsAdminBranch).ToListAsync();
        var startOfDay = date.Date;
        var endOfDay = date.Date.AddDays(1);
        var result = new List<DailyBranchRevenueDto>();

        foreach (var branch in branches)
        {
            var saleInvoices = await _context.Invoices
                .Where(x => x.BranchId == branch.Id && x.Type == InvoiceType.Sale && x.CreatedAt >= startOfDay && x.CreatedAt < endOfDay)
                .ToListAsync();

            var returnInvoices = await _context.Invoices
                .Where(x => x.BranchId == branch.Id && x.Type == InvoiceType.ReturnSale && x.CreatedAt >= startOfDay && x.CreatedAt < endOfDay)
                .ToListAsync();

            var deferredSales = await _context.Invoices
                .Where(x => x.BranchId == branch.Id && x.Type == InvoiceType.SaleDeferred && x.CreatedAt >= startOfDay && x.CreatedAt < endOfDay)
                .SumAsync(x => x.TotalAmount);

            var deferredCollected = await _context.ClientPayments
                .Where(x => x.BranchId == branch.Id && x.PaymentDate >= startOfDay && x.PaymentDate < endOfDay)
                .SumAsync(x => x.Amount);

            var cashAmount = saleInvoices.Where(x => x.PaymentMethod == PaymentMethod.Cash).Sum(x => x.TotalAmount);
            var vodafoneCashAmount = saleInvoices.Where(x => x.PaymentMethod == PaymentMethod.VodafoneCash).Sum(x => x.TotalAmount);
            var checkAmount = saleInvoices.Where(x => x.PaymentMethod == PaymentMethod.Check).Sum(x => x.TotalAmount);
            var returnsTotal = returnInvoices.Sum(x => x.TotalAmount);

            result.Add(new DailyBranchRevenueDto
            {
                BranchId = branch.Id,
                BranchName = branch.Name,
                CashAmount = cashAmount,
                VodafoneCashAmount = vodafoneCashAmount,
                CheckAmount = checkAmount,
                DeferredSales = deferredSales,
                DeferredCollected = deferredCollected,
                Returns = returnsTotal,
                NetRevenue = cashAmount + vodafoneCashAmount + checkAmount + deferredCollected - returnsTotal,
                InvoicesCount = saleInvoices.Count
            });
        }

        return result;
    }

    public async Task<IEnumerable<BranchDetailedComparisonDto>> GetBranchComparisonAsync(DateTime? dateFrom, DateTime? dateTo)
    {
        var now = DateTime.Now;
        var start = dateFrom ?? new DateTime(now.Year, now.Month, 1);
        var end = dateTo ?? start.AddMonths(1);
        var endDate = end.Date.AddDays(1);

        var branches = await _context.Branches.Where(x => !x.IsAdminBranch).ToListAsync();
        var result = new List<BranchDetailedComparisonDto>();

        foreach (var branch in branches)
        {
            var saleInvoices = await _context.Invoices
                .Where(x => x.BranchId == branch.Id && x.Type == InvoiceType.Sale && x.CreatedAt >= start && x.CreatedAt < endDate)
                .ToListAsync();

            var returnInvoices = await _context.Invoices
                .Where(x => x.BranchId == branch.Id && x.Type == InvoiceType.ReturnSale && x.CreatedAt >= start && x.CreatedAt < endDate)
                .ToListAsync();

            var revenue = saleInvoices.Sum(x => x.TotalAmount);
            var returns = returnInvoices.Sum(x => x.TotalAmount);
            var netRevenue = revenue - returns;

            var cogs = await _context.InvoiceItems
                .Where(x => x.Invoice.BranchId == branch.Id && x.Invoice.Type == InvoiceType.Sale && x.Invoice.CreatedAt >= start && x.Invoice.CreatedAt < endDate)
                .SumAsync(x => x.Quantity * x.CostAtTime);

            var profit = netRevenue - cogs;
            var margin = netRevenue > 0 ? Math.Round((profit / netRevenue) * 100, 2) : 0;

            result.Add(new BranchDetailedComparisonDto
            {
                BranchId = branch.Id,
                BranchName = branch.Name,
                Revenue = revenue,
                Returns = returns,
                NetRevenue = netRevenue,
                COGS = cogs,
                Profit = profit,
                ProfitMargin = margin,
                InvoicesCount = saleInvoices.Count
            });
        }

        return result.OrderByDescending(x => x.Revenue);
    }

    public async Task<IEnumerable<TopProductDto>> GetTopProductsFilteredAsync(DateTime? dateFrom, DateTime? dateTo, int? branchId, int limit, string sortBy)
    {
        var now = DateTime.Now;
        var start = dateFrom ?? new DateTime(now.Year, 1, 1);
        var end = dateTo ?? now;
        var endDate = end.Date.AddDays(1);

        var query = _context.InvoiceItems
            .Include(x => x.Invoice)
            .Include(x => x.Product)
            .Where(x => (x.Invoice.Type == InvoiceType.Sale || x.Invoice.Type == InvoiceType.SaleDeferred) && x.Invoice.CreatedAt >= start && x.Invoice.CreatedAt < endDate);

        if (branchId.HasValue)
            query = query.Where(x => x.Invoice.BranchId == branchId.Value);

        var grouped = await query
            .GroupBy(x => new { x.ProductId, x.Product.Name, x.Product.Barcode })
            .Select(g => new TopProductDto
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.Name,
                Barcode = g.Key.Barcode,
                TotalQuantity = (int)g.Sum(x => x.Quantity),
                TotalRevenue = g.Sum(x => x.TotalPrice ?? 0),
                TotalCost = g.Sum(x => x.Quantity * x.CostAtTime)
            })
            .ToListAsync();

        foreach (var item in grouped)
        {
            item.TotalProfit = item.TotalRevenue - item.TotalCost;
            item.ProfitMargin = item.TotalRevenue > 0 ? Math.Round((item.TotalProfit / item.TotalRevenue) * 100, 2) : 0;
        }

        var sorted = sortBy switch
        {
            "quantity" => grouped.OrderByDescending(x => x.TotalQuantity),
            "profit" => grouped.OrderByDescending(x => x.TotalProfit),
            _ => grouped.OrderByDescending(x => x.TotalRevenue)
        };

        return sorted.Take(limit);
    }

    public async Task<IEnumerable<InventoryValueDto>> GetInventoryValueAsync()
    {
        var products = await _context.Products.Where(x => x.IsActive).ToListAsync();
        var inventories = await _context.BranchInventories.Include(x => x.Branch).ToListAsync();
        var branches = await _context.Branches.Where(x => !x.IsAdminBranch).ToListAsync();
        var result = new List<InventoryValueDto>();

        foreach (var product in products)
        {
            var productInv = inventories.Where(x => x.ProductId == product.Id).ToList();
            var qtyPerBranch = new Dictionary<string, decimal>();
            foreach (var branch in branches)
            {
                var inv = productInv.FirstOrDefault(x => x.BranchId == branch.Id);
                qtyPerBranch[branch.Name] = inv?.Quantity ?? 0;
            }

            var totalQty = productInv.Sum(x => x.Quantity);
            var avgCost = totalQty > 0 ? productInv.Sum(x => x.Quantity * x.AverageCost) / totalQty : 0;

            result.Add(new InventoryValueDto
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Barcode = product.Barcode,
                Unit = product.Unit,
                QuantityPerBranch = qtyPerBranch,
                TotalQuantity = totalQty,
                AverageCost = avgCost,
                TotalValue = totalQty * avgCost,
                IsLowStock = totalQty <= product.MinStockAlert,
                MinStockAlert = product.MinStockAlert
            });
        }

        return result.OrderByDescending(x => x.TotalValue);
    }

    public async Task<DeferredAgingReportDto> GetDeferredAgingAsync()
    {
        var clients = await _context.Clients.Where(x => x.TotalDeferred > 0).ToListAsync();
        var deferredInvoices = await _context.DeferredInvoices
            .Include(x => x.Client)
            .Where(x => x.RemainingAmount > 0)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var result = new List<ClientAgingDto>();

        foreach (var client in clients)
        {
            var clientDeferred = deferredInvoices.Where(x => x.ClientId == client.Id).ToList();
            if (!clientDeferred.Any()) continue;

            var totalDebt = clientDeferred.Sum(x => x.RemainingAmount);
            var oldestInvoice = clientDeferred.MinBy(x => x.DueDate);

            var d0to30 = clientDeferred.Where(x => x.DueDate >= now.AddDays(-30)).Sum(x => x.RemainingAmount);
            var d31to60 = clientDeferred.Where(x => x.DueDate >= now.AddDays(-60) && x.DueDate < now.AddDays(-30)).Sum(x => x.RemainingAmount);
            var d61to90 = clientDeferred.Where(x => x.DueDate >= now.AddDays(-90) && x.DueDate < now.AddDays(-60)).Sum(x => x.RemainingAmount);
            var dOver90 = clientDeferred.Where(x => x.DueDate < now.AddDays(-90)).Sum(x => x.RemainingAmount);
            var usagePct = client.CreditLimit > 0 ? Math.Round((totalDebt / client.CreditLimit) * 100, 2) : 0;

            result.Add(new ClientAgingDto
            {
                ClientId = client.Id,
                ClientName = client.Name,
                TotalDebt = totalDebt,
                CreditLimit = client.CreditLimit,
                CreditUsagePercent = usagePct,
                Days0to30 = d0to30,
                Days31to60 = d31to60,
                Days61to90 = d61to90,
                DaysOver90 = dOver90,
                OldestInvoiceDate = oldestInvoice?.DueDate
            });
        }

        return new DeferredAgingReportDto
        {
            TotalDeferred = result.Sum(x => x.TotalDebt),
            ClientsWithDebt = result.Count,
            Clients = result.OrderByDescending(x => x.TotalDebt).ToList()
        };
    }

    public async Task<IEnumerable<DeferredCollectionDto>> GetDeferredCollectionsAsync(DateTime dateFrom, DateTime dateTo)
    {
        var endDate = dateTo.AddDays(1);
        var payments = await _context.ClientPayments
            .Include(x => x.Client)
            .Include(x => x.Branch)
            .Where(x => x.PaymentDate >= dateFrom && x.PaymentDate < endDate)
            .OrderByDescending(x => x.PaymentDate)
            .ToListAsync();

        return payments.Select(x => new DeferredCollectionDto
        {
            Date = x.PaymentDate,
            ClientName = x.Client?.Name ?? "",
            BranchName = x.Branch?.Name ?? "",
            Amount = x.Amount,
            PaymentMethod = x.PaymentMethod.ToString()
        });
    }

    public async Task<SalarySummaryDto> GetSalarySummaryDetailedAsync(int? month, int? year, int? branchId)
    {
        var now = DateTime.Now;
        var m = month ?? now.Month;
        var y = year ?? now.Year;
        var startDate = new DateTime(y, m, 1);
        var endDate = startDate.AddMonths(1);

        var empQuery = _context.Employees.AsQueryable();
        if (branchId.HasValue)
            empQuery = empQuery.Where(x => x.BranchId == branchId.Value);

        var employees = await empQuery.Where(x => x.IsActive).ToListAsync();
        var payments = await _context.SalaryPayments
            .Include(x => x.Employee)
            .Where(x => x.Month == m && x.Year == y)
            .ToListAsync();

        if (branchId.HasValue)
            payments = payments.Where(x => x.Employee.BranchId == branchId.Value).ToList();

        var advances = await _context.SalaryAdvances
            .Where(x => x.AdvanceDate >= startDate && x.AdvanceDate < endDate)
            .SumAsync(x => x.Amount);

        var result = new List<SalarySummaryItemDto>();

        foreach (var emp in employees)
        {
            var payment = payments.FirstOrDefault(x => x.EmployeeId == emp.Id);
            if (payment != null)
            {
                result.Add(new SalarySummaryItemDto
                {
                    EmployeeId = emp.Id,
                    EmployeeName = emp.FullName,
                    SalaryAmount = payment.Amount,
                    PaidDate = payment.PaidDate
                });
            }
        }

        return new SalarySummaryDto
        {
            DateFrom = startDate,
            DateTo = endDate,
            TotalSalaries = payments.Sum(x => x.Amount),
            TotalAdvances = advances,
            EmployeeCount = result.Count,
            Items = result
        };
    }

    public async Task<IEnumerable<InvoiceListDto>> GetAllInvoicesAsync(InvoiceFilterDto filter)
    {
        var query = _context.Invoices
            .Include(x => x.Branch)
            .Include(x => x.Client)
            .Include(x => x.CreatedBy)
            .Include(x => x.DeferredInvoice)
            .Include(x => x.RelatedInvoice)
            .Where(x => !x.IsCancelled)
            .AsQueryable();

        if (filter.BranchId.HasValue)
            query = query.Where(x => x.BranchId == filter.BranchId.Value);
        if (filter.Type.HasValue)
            query = query.Where(x => x.Type == (InvoiceType)filter.Type.Value);
        if (filter.DateFrom.HasValue)
            query = query.Where(x => x.CreatedAt >= filter.DateFrom.Value);
        if (filter.DateTo.HasValue)
            query = query.Where(x => x.CreatedAt <= filter.DateTo.Value);
        if (filter.ClientId.HasValue)
            query = query.Where(x => x.ClientId == filter.ClientId.Value);

        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return _mapper.Map<List<InvoiceListDto>>(items);
    }

    public async Task<LedgerResponseDto> GetLedgerAsync(DateTime? dateFrom, DateTime? dateTo, int? branchId)
    {
        var from = dateFrom?.Date ?? DateTime.Today;
        var to = dateTo?.Date.AddDays(1) ?? DateTime.Today.AddDays(1);
        var entries = await BuildLedgerEntriesAsync(from, to, branchId);
        var sorted = entries.OrderByDescending(x => x.Date).ToList();
        var totalIn = sorted.Sum(x => x.InAmount ?? 0);
        var totalOut = sorted.Sum(x => x.OutAmount ?? 0);

        return new LedgerResponseDto
        {
            TotalIn = totalIn,
            TotalOut = totalOut,
            NetAmount = totalIn - totalOut,
            Entries = sorted
        };
    }

    public async Task<PagedResult<LedgerEntryDto>> GetLedgerPagedAsync(LedgerFilterDto filter)
    {
        var from = filter.DateFrom?.Date ?? DateTime.Today;
        var to = filter.DateTo?.Date.AddDays(1) ?? DateTime.Today.AddDays(1);
        var entries = await BuildLedgerEntriesAsync(from, to, filter.BranchId);
        var totalCount = entries.Count;

        var paged = entries
            .OrderByDescending(x => x.Date)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToList();

        return new PagedResult<LedgerEntryDto>
        {
            Items = paged,
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize,
            SortBy = filter.SortBy,
            SortDirection = filter.SortDirection
        };
    }

    private async Task<List<LedgerEntryDto>> BuildLedgerEntriesAsync(DateTime from, DateTime to, int? branchId)
    {
        var entries = new List<LedgerEntryDto>();

        // 1. Sale invoices (cash in)
        var saleQuery = _context.Invoices
            .Where(x => x.Type == InvoiceType.Sale && x.CreatedAt >= from && x.CreatedAt < to);

        if (branchId.HasValue)
            saleQuery = saleQuery.Where(x => x.BranchId == branchId.Value);

        var saleInvoices = await saleQuery
            .Select(x => new { x.CreatedAt, x.TotalAmount, x.PaymentMethod, BranchName = x.Branch.Name, x.PaymentReference })
            .ToListAsync();
        foreach (var inv in saleInvoices)
        {
            entries.Add(new LedgerEntryDto
            {
                Date = inv.CreatedAt,
                Description = "فاتورة بيع",
                BranchName = inv.BranchName,
                Type = "بيع",
                PaymentMethod = inv.PaymentMethod.HasValue ? inv.PaymentMethod.Value.ToString() : null,
                InAmount = inv.TotalAmount,
                ReferenceNumber = inv.PaymentReference
            });
        }

        // 2. Deferred sale invoices (recorded as deferred sales)
        var deferredQuery = _context.Invoices
            .Where(x => x.Type == InvoiceType.SaleDeferred && x.CreatedAt >= from && x.CreatedAt < to);

        if (branchId.HasValue)
            deferredQuery = deferredQuery.Where(x => x.BranchId == branchId.Value);

        var deferredInvoices = await deferredQuery
            .Select(x => new { x.CreatedAt, x.TotalAmount, BranchName = x.Branch.Name })
            .ToListAsync();
        foreach (var inv in deferredInvoices)
        {
            entries.Add(new LedgerEntryDto
            {
                Date = inv.CreatedAt,
                Description = "فاتورة آجلة",
                BranchName = inv.BranchName,
                Type = "آجل",
                InAmount = inv.TotalAmount
            });
        }

        // 3. Return invoices (cash out)
        var returnsQuery = _context.Invoices
            .Where(x => (x.Type == InvoiceType.ReturnSale || x.Type == InvoiceType.ReturnDeferred) && x.CreatedAt >= from && x.CreatedAt < to);

        if (branchId.HasValue)
            returnsQuery = returnsQuery.Where(x => x.BranchId == branchId.Value);

        var returns = await returnsQuery
            .Select(x => new { x.CreatedAt, x.TotalAmount, x.ReturnReason, BranchName = x.Branch.Name })
            .ToListAsync();
        foreach (var r in returns)
        {
            entries.Add(new LedgerEntryDto
            {
                Date = r.CreatedAt,
                Description = $"مرتجع{(r.ReturnReason != null ? $" ({r.ReturnReason})" : "")}",
                BranchName = r.BranchName,
                Type = "مرتجع",
                OutAmount = r.TotalAmount
            });
        }

        // 4. Client payments (deferred collected - cash in)
        var cpQuery = _context.ClientPayments
            .Where(x => x.PaymentDate >= from && x.PaymentDate < to);

        if (branchId.HasValue)
            cpQuery = cpQuery.Where(x => x.BranchId == branchId.Value);

        var clientPayments = await cpQuery
            .Select(x => new { x.PaymentDate, x.Amount, x.PaymentMethod, BranchName = x.Branch.Name, ClientName = x.Client.Name, x.CheckNumber })
            .ToListAsync();
        foreach (var p in clientPayments)
        {
            entries.Add(new LedgerEntryDto
            {
                Date = p.PaymentDate,
                Description = $"تحصيل آجل من {p.ClientName}",
                BranchName = p.BranchName,
                Type = "تحصيل آجل",
                PaymentMethod = p.PaymentMethod.ToString(),
                InAmount = p.Amount,
                ReferenceNumber = p.CheckNumber
            });
        }

        // 5. Purchase invoices (cash out - paid portion)
        var piQuery = _context.PurchaseInvoices
            .Where(x => x.CreatedAt >= from && x.CreatedAt < to);

        if (branchId.HasValue)
            piQuery = piQuery.Where(x => x.BranchId == branchId.Value);

        var purchaseInvoices = await piQuery
            .Select(x => new { x.CreatedAt, x.PaidAmount, BranchName = x.Branch.Name, SupplierName = x.Supplier.Name })
            .ToListAsync();
        foreach (var p in purchaseInvoices.Where(x => x.PaidAmount > 0))
        {
            entries.Add(new LedgerEntryDto
            {
                Date = p.CreatedAt,
                Description = $"مشتريات من {p.SupplierName}",
                BranchName = p.BranchName,
                Type = "مشتريات",
                OutAmount = p.PaidAmount
            });
        }

        // 6. Supplier payments (cash out)
        var spQuery = _context.SupplierPayments
            .Where(x => x.PaymentDate >= from && x.PaymentDate < to);

        if (branchId.HasValue)
            spQuery = spQuery.Where(x => x.PurchaseInvoice != null && x.PurchaseInvoice.BranchId == branchId.Value);

        var supplierPayments = await spQuery
            .Select(x => new { x.PaymentDate, x.Amount, x.PaymentMethod, BranchName = x.PurchaseInvoice != null ? x.PurchaseInvoice.Branch.Name : null, SupplierName = x.Supplier.Name, x.CheckNumber })
            .ToListAsync();
        foreach (var p in supplierPayments)
        {
            entries.Add(new LedgerEntryDto
            {
                Date = p.PaymentDate,
                Description = $"دفعة لمورد {p.SupplierName}",
                BranchName = p.BranchName,
                Type = "دفعات موردين",
                PaymentMethod = p.PaymentMethod.ToString(),
                OutAmount = p.Amount,
                ReferenceNumber = p.CheckNumber
            });
        }

        // 7. Branch expenses (cash out)
        var expQuery = _context.Set<BranchExpense>()
            .Where(x => x.ExpenseDate >= from && x.ExpenseDate < to);

        if (branchId.HasValue)
            expQuery = expQuery.Where(x => x.BranchId == branchId.Value);

        var expenses = await expQuery
            .Select(x => new { x.ExpenseDate, x.Description, x.Amount, BranchName = x.Branch.Name })
            .ToListAsync();
        foreach (var e in expenses)
        {
            entries.Add(new LedgerEntryDto
            {
                Date = e.ExpenseDate,
                Description = $"مصروف: {e.Description}",
                BranchName = e.BranchName,
                Type = "مصروفات",
                OutAmount = e.Amount
            });
        }

        // 8. Salary payments (cash out)
        var salQuery = _context.SalaryPayments
            .Where(x => x.PaidDate >= from && x.PaidDate < to);

        if (branchId.HasValue)
            salQuery = salQuery.Where(x => x.Employee.BranchId == branchId.Value);

        var salaries = await salQuery
            .Select(x => new { x.PaidDate, x.Amount, EmployeeName = x.Employee.FullName, BranchName = x.Employee.Branch != null ? x.Employee.Branch.Name : null })
            .ToListAsync();
        foreach (var s in salaries)
        {
            entries.Add(new LedgerEntryDto
            {
                Date = s.PaidDate,
                Description = $"راتب: {s.EmployeeName}",
                BranchName = s.BranchName,
                Type = "رواتب",
                OutAmount = s.Amount
            });
        }

        return entries;
    }
}
