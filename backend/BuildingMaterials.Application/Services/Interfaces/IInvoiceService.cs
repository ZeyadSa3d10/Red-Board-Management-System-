using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Invoice;
using BuildingMaterials.Domain.Enums;

namespace BuildingMaterials.Application.Services.Interfaces;

public interface IInvoiceService
{
    Task<InvoiceResponseDto> CreateSaleInvoiceAsync(CreateSaleInvoiceDto dto, int employeeId);
    Task<InvoiceResponseDto> CreateDeferredInvoiceAsync(CreateDeferredInvoiceDto dto, int employeeId);
    Task<InvoiceResponseDto> CreateReturnInvoiceAsync(CreateReturnInvoiceDto dto, int employeeId);
    Task<InvoiceResponseDto> CreateSupplyInstallationInvoiceAsync(CreateSupplyInstallationDto dto, int employeeId);
    Task<PagedResult<InvoiceListDto>> GetInvoicesAsync(InvoiceFilterDto filter);
    Task<InvoiceResponseDto> GetByIdAsync(int id);
    Task<InvoiceResponseDto> GetByInvoiceNumberAsync(string invoiceNumber);
    Task<DailyRevenueDto> GetDailyRevenueAsync(int branchId, DateTime date);
    Task CancelInvoiceAsync(int id, int employeeId);
    Task<DailyRevenueDto> GetDailyRevenueAllBranchesAsync(DateTime date);
    Task<string> GenerateInvoiceNumberAsync(InvoiceType type);
}

public class InvoiceListDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = null!;
    public string Type { get; set; } = null!;
    public int? DeferredInvoiceId { get; set; }
    public int BranchId { get; set; }
    public string BranchName { get; set; } = null!;
    public int? ClientId { get; set; }
    public string? ClientName { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TransportCost { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? OriginalPaymentMethod { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Status { get; set; }
    public DateTime? DeferredDueDate { get; set; }
    public string? ProjectName { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = null!;
    public List<InvoiceItemResponseDto> Items { get; set; } = new();
}
