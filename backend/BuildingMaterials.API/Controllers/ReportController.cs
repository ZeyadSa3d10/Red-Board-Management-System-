using System.Security.Claims;
using BuildingMaterials.Application.DTOs.Invoice;
using BuildingMaterials.Application.DTOs.Report;
using BuildingMaterials.Application.Extensions;
using BuildingMaterials.Application.Services.Interfaces;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuestPDF.Fluent;
using QuestPDF.Helpers;

namespace BuildingMaterials.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("invoices/export")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> ExportInvoices([FromQuery] InvoiceFilterDto filter)
    {
        var invoices = await _reportService.GetAllInvoicesAsync(filter);
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("الفواتير");

        ws.RightToLeft = true;
        ws.Cell(1, 1).Value = "رقم الفاتورة";
        ws.Cell(1, 2).Value = "النوع";
        ws.Cell(1, 3).Value = "الفرع";
        ws.Cell(1, 4).Value = "العميل";
        ws.Cell(1, 5).Value = "المبلغ";
        ws.Cell(1, 6).Value = "التاريخ";
        var headerRange = ws.Range(1, 1, 1, 6);
        headerRange.Style.Font.Bold = true;

        var row = 2;
        foreach (var inv in invoices)
        {
            ws.Cell(row, 1).Value = inv.InvoiceNumber;
            ws.Cell(row, 2).Value = inv.Type;
            ws.Cell(row, 3).Value = inv.BranchName;
            ws.Cell(row, 4).Value = inv.ClientName ?? "";
            ws.Cell(row, 5).Value = (double)inv.TotalAmount;
            ws.Cell(row, 6).Value = inv.CreatedAt.ToString("yyyy-MM-dd");
            row++;
        }

        ws.Columns().AdjustToContents();
        var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;

        return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"invoices_{DateTime.Today:yyyyMMdd}.xlsx");
    }

    [HttpGet("invoices/export-pdf")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> ExportInvoicesPdf([FromQuery] InvoiceFilterDto filter)
    {
        var invoices = await _reportService.GetAllInvoicesAsync(filter);

        QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(20);
                page.Header().Element(c => c.Row(r =>
                {
                    r.RelativeItem().Text("تقرير الفواتير").FontSize(16).Bold();
                }));
                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(c =>
                    {
                        c.ConstantColumn(100);
                        c.RelativeColumn();
                        c.RelativeColumn();
                        c.RelativeColumn();
                        c.ConstantColumn(60);
                    });
                    table.Header(header =>
                    {
                        header.Cell().Text("رقم الفاتورة").Bold();
                        header.Cell().Text("النوع").Bold();
                        header.Cell().Text("الفرع").Bold();
                        header.Cell().Text("العميل").Bold();
                        header.Cell().Text("المبلغ").Bold().AlignRight();
                    });
                    foreach (var inv in invoices)
                    {
                        table.Cell().Text(inv.InvoiceNumber);
                        table.Cell().Text(inv.Type);
                        table.Cell().Text(inv.BranchName);
                        table.Cell().Text(inv.ClientName ?? "");
                        table.Cell().Text(inv.TotalAmount.ToString("N2")).AlignRight();
                    }
                });
            });
        });

        var pdfBytes = pdf.GeneratePdf();
        return File(pdfBytes, "application/pdf",
            $"invoices_{DateTime.Today:yyyyMMdd}.pdf");
    }

    [HttpGet("dashboard")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> GetDashboard([FromQuery] DateTime? dateFrom = null, [FromQuery] DateTime? dateTo = null)
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var stats = await _reportService.GetOwnerDashboardStatsAsync(dateFrom, dateTo);
        DtoSanitizer.Sanitize(stats, role);
        return Ok(stats);
    }

    [HttpGet("revenue-by-payment")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetRevenueByPayment([FromQuery] DateTime? dateFrom = null, [FromQuery] DateTime? dateTo = null)
    {
        var result = await _reportService.GetRevenueByPaymentAsync(dateFrom ?? DateTime.Today, dateTo ?? DateTime.Today);
        return Ok(result);
    }

    [HttpGet("branch/{id}/monthly")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetBranchMonthlyReport(int id, [FromQuery] int month, [FromQuery] int year)
    {
        var result = await _reportService.GetBranchMonthlyReportAsync(id, month, year);
        return Ok(result);
    }

    [HttpGet("products/top")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetTopProducts([FromQuery] int count = 10)
    {
        var result = await _reportService.GetTopProductsAsync(count);
        return Ok(result);
    }

    [HttpGet("salary-summary")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetSalarySummary([FromQuery] DateTime? dateFrom = null, [FromQuery] DateTime? dateTo = null)
    {
        var result = await _reportService.GetSalarySummaryAsync(dateFrom ?? DateTime.Today, dateTo ?? DateTime.Today);
        return Ok(result);
    }

    [HttpGet("pnl")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> GetPnL([FromQuery] DateTime? dateFrom = null, [FromQuery] DateTime? dateTo = null, [FromQuery] int? branchId = null)
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var result = await _reportService.GetPnLAsync(dateFrom, dateTo, branchId);
        DtoSanitizer.Sanitize(result, role);
        return Ok(result);
    }

    [HttpGet("daily-all")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> GetDailyAllBranches([FromQuery] DateTime date)
    {
        var result = await _reportService.GetDailyAllBranchesAsync(date);
        return Ok(result);
    }

    [HttpGet("branch-comparison")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> GetBranchComparison([FromQuery] DateTime? dateFrom = null, [FromQuery] DateTime? dateTo = null)
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var result = (await _reportService.GetBranchComparisonAsync(dateFrom, dateTo)).ToList();
        DtoSanitizer.SanitizeList(result, role);
        return Ok(result);
    }

    [HttpGet("top-products")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> GetTopProductsFiltered([FromQuery] DateTime? dateFrom = null, [FromQuery] DateTime? dateTo = null, [FromQuery] int? branchId = null, [FromQuery] int limit = 10, [FromQuery] string sortBy = "revenue")
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var result = (await _reportService.GetTopProductsFilteredAsync(dateFrom, dateTo, branchId, limit, sortBy)).ToList();
        DtoSanitizer.SanitizeList(result, role);
        return Ok(result);
    }

    [HttpGet("inventory-value")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> GetInventoryValue()
    {
        var result = await _reportService.GetInventoryValueAsync();
        return Ok(result);
    }

    [HttpGet("deferred-aging")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> GetDeferredAging()
    {
        var result = await _reportService.GetDeferredAgingAsync();
        return Ok(result);
    }

    [HttpGet("deferred-collections")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> GetDeferredCollections([FromQuery] DateTime? dateFrom = null, [FromQuery] DateTime? dateTo = null)
    {
        var result = await _reportService.GetDeferredCollectionsAsync(dateFrom ?? DateTime.Today.AddMonths(-1), dateTo ?? DateTime.Today);
        return Ok(result);
    }

    [HttpGet("salary-summary-detailed")]
    [Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetSalarySummaryDetailed([FromQuery] int? month = null, [FromQuery] int? year = null, [FromQuery] int? branchId = null)
    {
        var result = await _reportService.GetSalarySummaryDetailedAsync(month, year, branchId);
        return Ok(result);
    }

    [HttpGet("sales-stats")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetSalesStats(
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null,
        [FromQuery] int? branchId = null,
        [FromQuery] int? type = null)
    {
        var userRole = User.FindFirstValue(ClaimTypes.Role);
        var userBranchId = User.FindFirstValue("BranchId");
        if (userRole == "Staff" && !branchId.HasValue)
            branchId = int.Parse(userBranchId!);
        var result = await _reportService.GetSalesStatsAsync(dateFrom, dateTo, branchId, type);
        return Ok(result);
    }

    [HttpGet("ledger")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetLedger([FromQuery] DateTime? dateFrom = null, [FromQuery] DateTime? dateTo = null, [FromQuery] int? branchId = null)
    {
        var result = await _reportService.GetLedgerAsync(dateFrom, dateTo, branchId);
        return Ok(result);
    }

    [HttpGet("ledger-paged")]
    [Authorize(Roles = "Owner,Accountant,Staff")]
    public async Task<IActionResult> GetLedgerPaged([FromQuery] LedgerFilterDto filter)
    {
        var userBranchId = User.FindFirstValue("BranchId");
        var userRole = User.FindFirstValue(ClaimTypes.Role);
        if (userRole == "Staff" && !filter.BranchId.HasValue)
            filter.BranchId = int.Parse(userBranchId!);
        var result = await _reportService.GetLedgerPagedAsync(filter);
        return Ok(result);
    }
}
