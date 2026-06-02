using AutoMapper;
using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Purchase;
using BuildingMaterials.Application.DTOs.Supplier;
using BuildingMaterials.Application.Services.Interfaces;
using BuildingMaterials.Domain.Entities;
using BuildingMaterials.Domain.Enums;
using BuildingMaterials.Domain.Exceptions;
using BuildingMaterials.Infrastructure.Data;
using BuildingMaterials.Application.Extensions;
using BuildingMaterials.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterials.Application.Services;

public class PurchaseService : IPurchaseService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public PurchaseService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<PurchaseInvoiceResponseDto> AddPurchaseInvoiceAsync(CreatePurchaseInvoiceDto dto, int employeeId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var invoice = new PurchaseInvoice
            {
                InvoiceNumber = await GeneratePurchaseNumberAsync(),
                SupplierId = dto.SupplierId,
                BranchId = dto.BranchId,
                InvoiceDate = dto.InvoiceDate,
                TransportCost = dto.TransportCost,
                ProjectName = dto.ProjectName,
                Notes = dto.Notes,
                AddedByEmployeeId = employeeId,
                AddedById = employeeId,
                PaidAmount = dto.PaidNow
            };

            decimal total = 0;

            foreach (var itemDto in dto.Items)
            {
                var itemTotal = itemDto.Quantity * itemDto.UnitCost;
                total += itemTotal;

                invoice.Items.Add(new PurchaseInvoiceItem
                {
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    UnitCost = itemDto.UnitCost,
                    TotalCost = itemTotal
                });

                var inventory = await _context.BranchInventories
                    .FirstOrDefaultAsync(x => x.ProductId == itemDto.ProductId
                                           && x.BranchId == dto.BranchId);

                if (inventory == null)
                {
                    _context.BranchInventories.Add(new BranchInventory
                    {
                        ProductId = itemDto.ProductId,
                        BranchId = dto.BranchId,
                        Quantity = itemDto.Quantity,
                        AverageCost = itemDto.UnitCost
                    });
                }
                else
                {
                    var newQty = inventory.Quantity + itemDto.Quantity;
                    var newAvgCost = ((inventory.Quantity * inventory.AverageCost)
                                   + (itemDto.Quantity * itemDto.UnitCost)) / newQty;
                    inventory.Quantity = newQty;
                    inventory.AverageCost = newAvgCost;
                }

                var product = await _context.Products.FindAsync(itemDto.ProductId);
                if (product != null) product.PurchasePrice = itemDto.UnitCost;
            }

            invoice.TotalAmount = total + dto.TransportCost;
            invoice.RemainingAmount = invoice.TotalAmount - dto.PaidNow;

            var supplier = await _context.Suppliers.FindAsync(dto.SupplierId);
            if (supplier != null)
            {
                supplier.TotalPurchases += total + dto.TransportCost;
                supplier.TotalPaid += dto.PaidNow;
                supplier.TotalDue += (total + dto.TransportCost - dto.PaidNow);
            }

            _context.PurchaseInvoices.Add(invoice);

            if (dto.PaidNow > 0 && !string.IsNullOrEmpty(dto.PaymentMethod))
            {
                _context.SupplierPayments.Add(new SupplierPayment
                {
                    SupplierId = dto.SupplierId,
                    PurchaseInvoice = invoice,
                    Amount = dto.PaidNow,
                    PaymentMethod = Enum.TryParse<PaymentMethod>(dto.PaymentMethod, ignoreCase: true, out var paymentMethod)
                        ? paymentMethod
                        : throw new BusinessException($"طريقة دفع غير صالحة: {dto.PaymentMethod}"),
                    PaymentDate = DateTime.UtcNow,
                    CheckNumber = dto.CheckNumber,
                    PaidByEmployeeId = employeeId,
                    PaidById = employeeId
                });
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return _mapper.Map<PurchaseInvoiceResponseDto>(invoice);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<PagedResult<PurchaseInvoiceResponseDto>> GetFilteredAsync(PurchaseFilterDto filter)
    {
        var query = _context.PurchaseInvoices
            .Include(x => x.Supplier)
            .Include(x => x.Branch)
            .Include(x => x.AddedBy)
            .Include(x => x.Items).ThenInclude(x => x.Product)
            .Include(x => x.Payments)
            .AsQueryable()
            .ApplySearch(filter.Search, p => p.InvoiceNumber)
            .ApplyWhereIf(filter.SupplierId.HasValue, p => p.SupplierId == filter.SupplierId!.Value)
            .ApplyWhereIf(filter.DateFrom.HasValue, p => p.InvoiceDate >= filter.DateFrom!.Value)
            .ApplyWhereIf(filter.DateTo.HasValue, p => p.InvoiceDate <= filter.DateTo!.Value);

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            query = filter.Status == "paid"
                ? query.Where(p => p.RemainingAmount <= 0)
                : query.Where(p => p.RemainingAmount > 0);
        }

        return await query.ToPagedResultAsync<PurchaseInvoice, PurchaseInvoiceResponseDto>(filter, _mapper);
    }

    public async Task<IEnumerable<PurchaseInvoiceResponseDto>> GetBySupplierIdAsync(int supplierId)
    {
        var invoices = await _context.PurchaseInvoices
            .Include(x => x.Supplier)
            .Include(x => x.Branch)
            .Include(x => x.Items)
            .ThenInclude(x => x.Product)
            .Where(x => x.SupplierId == supplierId)
            .ToListAsync();
        return _mapper.Map<IEnumerable<PurchaseInvoiceResponseDto>>(invoices);
    }

    public async Task<IEnumerable<PurchaseInvoiceResponseDto>> GetAllAsync(int? branchId = null)
    {
        var query = _context.PurchaseInvoices
            .Include(x => x.Supplier)
            .Include(x => x.Branch)
            .Include(x => x.AddedBy)
            .Include(x => x.Items)
            .ThenInclude(x => x.Product)
            .Include(x => x.Payments)
            .AsQueryable();

        if (branchId.HasValue)
            query = query.Where(x => x.BranchId == branchId.Value);

        var invoices = await query.OrderByDescending(x => x.CreatedAt).ToListAsync();
        return _mapper.Map<IEnumerable<PurchaseInvoiceResponseDto>>(invoices);
    }

    public async Task<PurchaseInvoiceResponseDto> GetByIdAsync(int id)
    {
        var invoice = await _context.PurchaseInvoices
            .Include(x => x.Supplier)
            .Include(x => x.Branch)
            .Include(x => x.AddedBy)
            .Include(x => x.Items)
            .ThenInclude(x => x.Product)
            .Include(x => x.Payments)
            .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new NotFoundException("فاتورة المشتريات غير موجودة");
        return _mapper.Map<PurchaseInvoiceResponseDto>(invoice);
    }

    public async Task AddPaymentAsync(int purchaseId, SupplierPaymentDto dto, int employeeId)
    {
        var invoice = await _context.PurchaseInvoices
            .Include(x => x.Supplier)
            .FirstOrDefaultAsync(x => x.Id == purchaseId)
            ?? throw new NotFoundException("فاتورة المشتريات غير موجودة");

        if (dto.Amount > invoice.RemainingAmount)
            throw new BusinessException("المبلغ يتجاوز المتبقي من الفاتورة");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var payment = new SupplierPayment
            {
                SupplierId = invoice.SupplierId,
                PurchaseInvoiceId = purchaseId,
                Amount = dto.Amount,
                PaymentMethod = Enum.TryParse<PaymentMethod>(dto.PaymentMethod, ignoreCase: true, out var paymentMethod)
                    ? paymentMethod
                    : throw new BusinessException($"طريقة دفع غير صالحة: {dto.PaymentMethod}"),
                PaymentDate = dto.PaymentDate,
                CheckNumber = dto.CheckNumber,
                PaidByEmployeeId = employeeId,
                PaidById = employeeId,
                Notes = dto.Notes
            };

            invoice.PaidAmount += dto.Amount;
            invoice.RemainingAmount -= dto.Amount;

            invoice.Supplier.TotalPaid += dto.Amount;
            invoice.Supplier.TotalDue = Math.Max(0, invoice.Supplier.TotalDue - dto.Amount);

            _context.SupplierPayments.Add(payment);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private async Task<string> GeneratePurchaseNumberAsync()
    {
        var year = DateTime.Now.Year;

        for (int attempt = 0; attempt < 3; attempt++)
        {
            var lastInvoice = await _context.PurchaseInvoices
                .Where(x => x.CreatedAt.Year == year)
                .OrderByDescending(x => x.InvoiceNumber)
                .Select(x => x.InvoiceNumber)
                .FirstOrDefaultAsync();

            var lastNumber = 0;
            if (!string.IsNullOrEmpty(lastInvoice))
            {
                var parts = lastInvoice.Split('-');
                if (parts.Length >= 3 && int.TryParse(parts[^1], out var parsed))
                    lastNumber = parsed;
            }

            var newNumber = $"PINV-{year}-{(lastNumber + 1):D6}";

            try
            {
                var exists = await _context.PurchaseInvoices.AnyAsync(x => x.InvoiceNumber == newNumber);
                if (!exists)
                    return newNumber;
            }
            catch
            {
                if (attempt == 2) throw;
            }
        }

        throw new BusinessException("فشل في توليد رقم فاتورة المشتريات");
    }
}
