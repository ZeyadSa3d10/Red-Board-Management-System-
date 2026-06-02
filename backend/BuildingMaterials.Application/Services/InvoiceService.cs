using AutoMapper;
using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Invoice;
using BuildingMaterials.Application.Services.Interfaces;
using BuildingMaterials.Domain.Entities;
using BuildingMaterials.Domain.Enums;
using BuildingMaterials.Domain.Exceptions;
using BuildingMaterials.Infrastructure.Data;
using BuildingMaterials.Application.Extensions;
using BuildingMaterials.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterials.Application.Services;

public class InvoiceService : IInvoiceService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly INotificationService _notificationService;

    public InvoiceService(AppDbContext context, IMapper mapper, INotificationService notificationService)
    {
        _context = context;
        _mapper = mapper;
        _notificationService = notificationService;
    }

    public async Task<InvoiceResponseDto> CreateSaleInvoiceAsync(CreateSaleInvoiceDto dto, int employeeId)
    {
        foreach (var item in dto.Items)
        {
            var inventory = await _context.BranchInventories
                .FirstOrDefaultAsync(x => x.ProductId == item.ProductId && x.BranchId == dto.BranchId);

            if (inventory == null || inventory.Quantity < item.Quantity)
                throw new BusinessException($"الكمية المتاحة في المخزون غير كافية للمنتج رقم {item.ProductId}");

            var product = await _context.Products.FindAsync(item.ProductId)
                ?? throw new BusinessException($"المنتج رقم {item.ProductId} غير موجود");
            if (item.UnitPrice < product.MinSalePrice)
                throw new BusinessException($"سعر البيع أقل من الحد المسموح للمنتج: {product.Name}");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var invoice = new Invoice
            {
                InvoiceNumber = await GenerateInvoiceNumberAsync(InvoiceType.Sale),
                Type = InvoiceType.Sale,
                BranchId = dto.BranchId,
                ClientId = dto.ClientId,
                WalkInClientName = dto.WalkInClientName,
                PaymentMethod = dto.PaymentMethod,
                PaymentReference = dto.PaymentReference,
                Discount = dto.Discount,
                TransportCost = dto.TransportCost,
                Notes = dto.Notes,
                CreatedByEmployeeId = employeeId,
                CreatedAt = DateTime.UtcNow
            };

            decimal subtotal = 0;
            var invoiceItems = new List<InvoiceItem>();

            foreach (var itemDto in dto.Items)
            {
                var inventory = await _context.BranchInventories
                    .FirstAsync(x => x.ProductId == itemDto.ProductId && x.BranchId == dto.BranchId);

                var prod = await _context.Products.FindAsync(itemDto.ProductId);

                var item = new InvoiceItem
                {
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    UnitPrice = itemDto.UnitPrice,
                    TotalPrice = itemDto.Quantity * itemDto.UnitPrice,
                    CostAtTime = inventory.AverageCost
                };

                subtotal += item.TotalPrice ?? 0;
                inventory.Quantity -= itemDto.Quantity;
                invoiceItems.Add(item);

                if (prod != null && inventory.Quantity <= prod.MinStockAlert)
                {
                    await _notificationService.NotifyLowStockAsync(prod.Name, dto.BranchId, inventory.Quantity);
                }
            }

            invoice.Subtotal = subtotal;
            invoice.TotalAmount = subtotal - dto.Discount + dto.TransportCost;
            invoice.Items = invoiceItems;

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            if (invoice.TotalAmount > 50000)
            {
                var branch = await _context.Branches.FindAsync(dto.BranchId);
                await _notificationService.NotifyLargeInvoiceAsync(invoice.InvoiceNumber, invoice.TotalAmount, branch?.Name ?? "");
            }

            return _mapper.Map<InvoiceResponseDto>(invoice);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<InvoiceResponseDto> CreateDeferredInvoiceAsync(CreateDeferredInvoiceDto dto, int employeeId)
    {
        foreach (var item in dto.Items)
        {
            var inventory = await _context.BranchInventories
                .FirstOrDefaultAsync(x => x.ProductId == item.ProductId && x.BranchId == dto.BranchId);

            if (inventory == null || inventory.Quantity < item.Quantity)
                throw new BusinessException($"الكمية المتاحة في المخزون غير كافية للمنتج رقم {item.ProductId}");

            var product = await _context.Products.FindAsync(item.ProductId)
                ?? throw new BusinessException($"المنتج رقم {item.ProductId} غير موجود");
            if (item.UnitPrice < product.MinSalePrice)
                throw new BusinessException($"سعر البيع أقل من الحد المسموح للمنتج: {product.Name}");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var invoice = new Invoice
            {
                InvoiceNumber = await GenerateInvoiceNumberAsync(InvoiceType.SaleDeferred),
                Type = InvoiceType.SaleDeferred,
                BranchId = dto.BranchId,
                ClientId = dto.ClientId,
                DeferredDueDate = dto.DueDate,
                Discount = dto.Discount,
                TransportCost = dto.TransportCost,
                Notes = dto.Notes,
                CreatedByEmployeeId = employeeId,
                CreatedAt = DateTime.UtcNow
            };

            decimal subtotal = 0;
            foreach (var itemDto in dto.Items)
            {
                var inventory = await _context.BranchInventories
                    .FirstAsync(x => x.ProductId == itemDto.ProductId && x.BranchId == dto.BranchId);

                invoice.Items.Add(new InvoiceItem
                {
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    UnitPrice = itemDto.UnitPrice,
                    TotalPrice = itemDto.Quantity * itemDto.UnitPrice,
                    CostAtTime = inventory.AverageCost
                });

                subtotal += itemDto.Quantity * itemDto.UnitPrice;
                inventory.Quantity -= itemDto.Quantity;
            }

            invoice.Subtotal = subtotal;
            invoice.TotalAmount = subtotal - dto.Discount + dto.TransportCost;

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            var deferred = new DeferredInvoice
            {
                ClientId = dto.ClientId,
                InvoiceId = invoice.Id,
                BranchId = dto.BranchId,
                OriginalAmount = invoice.TotalAmount,
                RemainingAmount = invoice.TotalAmount,
                PaidAmount = 0,
                DueDate = dto.DueDate,
                Status = DeferredStatus.Unpaid
            };
            _context.DeferredInvoices.Add(deferred);

            var client = await _context.Clients.FindAsync(dto.ClientId)
                ?? throw new BusinessException("العميل غير موجود");
            if (client.CreditLimit > 0 && (client.TotalDeferred + invoice.TotalAmount) > client.CreditLimit)
                throw new BusinessException($"تجاوز الحد الائتماني للعميل. المديونية الحالية: {client.TotalDeferred}, المبلغ الجديد: {invoice.TotalAmount}, الحد الائتماني: {client.CreditLimit}");
            client.TotalDeferred += invoice.TotalAmount;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            if (invoice.TotalAmount > 50000)
            {
                var branch = await _context.Branches.FindAsync(dto.BranchId);
                await _notificationService.NotifyLargeInvoiceAsync(invoice.InvoiceNumber, invoice.TotalAmount, branch?.Name ?? "");
            }

            return _mapper.Map<InvoiceResponseDto>(invoice);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<InvoiceResponseDto> CreateReturnInvoiceAsync(CreateReturnInvoiceDto dto, int employeeId)
    {
        var originalInvoice = await _context.Invoices
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == dto.RelatedInvoiceId)
            ?? throw new NotFoundException("الفاتورة الأصلية غير موجودة");

        var existingReturns = await _context.Invoices
            .Include(x => x.Items)
            .Where(x => x.RelatedInvoiceId == dto.RelatedInvoiceId && !x.IsCancelled)
            .ToListAsync();

        var returnedQuantities = existingReturns
            .SelectMany(x => x.Items)
            .GroupBy(i => i.ProductId)
            .ToDictionary(g => g.Key, g => g.Sum(i => i.Quantity));

        foreach (var item in dto.Items)
        {
            var originalItem = originalInvoice.Items.FirstOrDefault(x => x.ProductId == item.ProductId)
                ?? throw new BusinessException("المنتج غير موجود في الفاتورة الأصلية");

            var alreadyReturned = returnedQuantities.GetValueOrDefault(item.ProductId, 0);
            var remaining = originalItem.Quantity - alreadyReturned;

            if (remaining <= 0)
                throw new BusinessException($"المنتج تم استرجاعه بالكامل بالفعل");

            if (item.Quantity > remaining)
                throw new BusinessException($"الكمية المرتجعة تتجاوز المتبقي القابل للإرجاع (المتبقي: {remaining})");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var returnType = originalInvoice.Type switch
            {
                InvoiceType.SaleDeferred => InvoiceType.ReturnDeferred,
                InvoiceType.SupplyAndInstallation => InvoiceType.ReturnSupplyAndInstallation,
                _ => InvoiceType.ReturnSale
            };

            var retPm = !string.IsNullOrEmpty(dto.PaymentMethod) && Enum.TryParse<PaymentMethod>(dto.PaymentMethod, ignoreCase: true, out var parsedPm) ? parsedPm : (PaymentMethod?)null;

            var returnInvoice = new Invoice
            {
                InvoiceNumber = await GenerateInvoiceNumberAsync(returnType),
                Type = returnType,
                BranchId = dto.BranchId,
                RelatedInvoiceId = dto.RelatedInvoiceId,
                ClientId = originalInvoice.ClientId,
                ProjectName = originalInvoice.ProjectName,
                PaymentMethod = retPm,
                PaymentReference = dto.PaymentReference,
                ReturnReason = dto.ReturnReason,
                Notes = dto.Notes,
                CreatedByEmployeeId = employeeId
            };

            decimal total = 0;
            foreach (var itemDto in dto.Items)
            {
                var originalItem = originalInvoice.Items.First(x => x.ProductId == itemDto.ProductId);

                returnInvoice.Items.Add(new InvoiceItem
                {
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    UnitPrice = originalItem.UnitPrice,
                    TotalPrice = itemDto.Quantity * originalItem.UnitPrice,
                    CostAtTime = originalItem.CostAtTime
                });

                total += itemDto.Quantity * originalItem.UnitPrice ?? 0;

                var inventory = await _context.BranchInventories
                    .FirstOrDefaultAsync(x => x.ProductId == itemDto.ProductId && x.BranchId == dto.BranchId);

                if (inventory == null)
                {
                    _context.BranchInventories.Add(new BranchInventory
                    {
                        ProductId = itemDto.ProductId,
                        BranchId = dto.BranchId,
                        Quantity = itemDto.Quantity,
                        AverageCost = originalItem.CostAtTime
                    });
                }
                else
                {
                    var newAvgCost = ((inventory.Quantity * inventory.AverageCost)
                                   + (itemDto.Quantity * originalItem.CostAtTime))
                                   / (inventory.Quantity + itemDto.Quantity);
                    inventory.Quantity += itemDto.Quantity;
                    inventory.AverageCost = newAvgCost;
                }
            }

            returnInvoice.Subtotal = total;
            returnInvoice.TotalAmount = total;

            if (returnType == InvoiceType.ReturnDeferred)
            {
                var deferred = await _context.DeferredInvoices
                    .FirstOrDefaultAsync(x => x.InvoiceId == dto.RelatedInvoiceId);
                if (deferred != null)
                {
                    deferred.RemainingAmount -= total;
                    deferred.PaidAmount += total;
                    if (deferred.RemainingAmount <= 0) deferred.Status = DeferredStatus.Paid;

                    var client = await _context.Clients.FindAsync(deferred.ClientId);
                    if (client != null)
                    {
                        client.TotalDeferred = Math.Max(0, client.TotalDeferred - total);
                    }
                }
            }

            _context.Invoices.Add(returnInvoice);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return _mapper.Map<InvoiceResponseDto>(returnInvoice);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<InvoiceResponseDto> CreateSupplyInstallationInvoiceAsync(CreateSupplyInstallationDto dto, int employeeId)
    {
        foreach (var item in dto.Items)
        {
            var inventory = await _context.BranchInventories
                .FirstOrDefaultAsync(x => x.ProductId == item.ProductId && x.BranchId == dto.BranchId);

            if (inventory == null || inventory.Quantity < item.Quantity)
                throw new BusinessException($"الكمية المتاحة في المخزون غير كافية للمنتج رقم {item.ProductId}");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var invoice = new Invoice
            {
                InvoiceNumber = await GenerateInvoiceNumberAsync(InvoiceType.SupplyAndInstallation),
                Type = InvoiceType.SupplyAndInstallation,
                BranchId = dto.BranchId,
                ProjectName = dto.ProjectName,
                Notes = dto.Notes,
                CreatedByEmployeeId = employeeId,
                CreatedAt = DateTime.UtcNow
            };

            foreach (var itemDto in dto.Items)
            {
                var inventory = await _context.BranchInventories
                    .FirstAsync(x => x.ProductId == itemDto.ProductId && x.BranchId == dto.BranchId);

                invoice.Items.Add(new InvoiceItem
                {
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    UnitPrice = 0,
                    TotalPrice = 0,
                    CostAtTime = inventory.AverageCost
                });

                inventory.Quantity -= itemDto.Quantity;
            }

            invoice.Subtotal = 0;
            invoice.TotalAmount = 0;

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return _mapper.Map<InvoiceResponseDto>(invoice);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<PagedResult<InvoiceListDto>> GetInvoicesAsync(InvoiceFilterDto filter)
    {
        var query = _context.Invoices
            .Include(x => x.Branch)
            .Include(x => x.Client)
            .Include(x => x.CreatedBy)
            .Include(x => x.DeferredInvoice)
            .Include(x => x.RelatedInvoice)
                .ThenInclude(x => x.DeferredInvoice)
            .Where(x => !x.IsCancelled)
            .AsQueryable()
            .ApplyWhereIf(filter.BranchId.HasValue, x => x.BranchId == filter.BranchId!.Value)
            .ApplyWhereIf(filter.Type.HasValue, x => x.Type == (InvoiceType)filter.Type!.Value)
            .ApplyWhereIf(filter.DateFrom.HasValue, x => x.CreatedAt >= filter.DateFrom!.Value)
            .ApplyWhereIf(filter.DateTo.HasValue, x => x.CreatedAt <= filter.DateTo!.Value)
            .ApplyWhereIf(filter.ClientId.HasValue, x => x.ClientId == filter.ClientId!.Value)
            .ApplySearch(filter.Search, x => x.InvoiceNumber, x => x.WalkInClientName, x => x.ProjectName);

        if (!string.IsNullOrEmpty(filter.Types))
        {
            var typeValues = filter.Types.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => { int.TryParse(s.Trim(), out var v); return v; })
                .Where(v => v > 0)
                .Select(v => (InvoiceType)v)
                .ToList();
            if (typeValues.Count > 0)
                query = query.Where(x => typeValues.Contains(x.Type));
        }

        if (filter.RelatedInvoiceId.HasValue)
        {
            query = query.Where(x => x.RelatedInvoiceId == filter.RelatedInvoiceId.Value);
            query = query.Include(x => x.Items).ThenInclude(x => x.Product);
        }

        return await query.ToPagedResultAsync<Invoice, InvoiceListDto>(filter, _mapper);
    }

    public async Task<InvoiceResponseDto> GetByIdAsync(int id)
    {
        var invoice = await _context.Invoices
            .Include(x => x.Branch)
            .Include(x => x.Client)
            .Include(x => x.CreatedBy)
            .Include(x => x.DeferredInvoice)
            .Include(x => x.Items)
                .ThenInclude(x => x.Product)
            .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new NotFoundException("الفاتورة غير موجودة");
        return _mapper.Map<InvoiceResponseDto>(invoice);
    }

    public async Task<InvoiceResponseDto> GetByInvoiceNumberAsync(string invoiceNumber)
    {
        var invoice = await _context.Invoices
            .Include(x => x.Branch)
            .Include(x => x.Client)
            .Include(x => x.CreatedBy)
            .Include(x => x.DeferredInvoice)
            .Include(x => x.Items)
                .ThenInclude(x => x.Product)
            .FirstOrDefaultAsync(x => x.InvoiceNumber == invoiceNumber)
            ?? throw new NotFoundException("الفاتورة غير موجودة");
        return _mapper.Map<InvoiceResponseDto>(invoice);
    }

    public async Task<DailyRevenueDto> GetDailyRevenueAsync(int branchId, DateTime date)
    {
        var startOfDay = date.Date;
        var endOfDay = date.Date.AddDays(1);

        var saleInvoices = await _context.Invoices
            .Where(x => x.BranchId == branchId
                     && x.Type == InvoiceType.Sale
                     && x.CreatedAt >= startOfDay
                     && x.CreatedAt < endOfDay)
            .ToListAsync();

        var returnInvoices = await _context.Invoices
            .Where(x => x.BranchId == branchId
                     && x.Type == InvoiceType.ReturnSale
                     && x.CreatedAt >= startOfDay
                     && x.CreatedAt < endOfDay)
            .ToListAsync();

        var deferredPayments = await _context.ClientPayments
            .Where(x => x.BranchId == branchId
                     && x.PaymentDate >= startOfDay
                     && x.PaymentDate < endOfDay)
            .SumAsync(x => x.Amount);

        var totalSales = saleInvoices.Sum(x => x.TotalAmount);
        var totalReturns = returnInvoices.Sum(x => x.TotalAmount);

        return new DailyRevenueDto
        {
            Date = date,
            BranchId = branchId,
            TotalSales = totalSales,
            TotalReturns = totalReturns,
            DeferredPayments = deferredPayments,
            NetRevenue = totalSales - totalReturns + deferredPayments,
            InvoicesCount = saleInvoices.Count,
            CashAmount = saleInvoices.Where(x => x.PaymentMethod == PaymentMethod.Cash).Sum(x => x.TotalAmount),
            VodafoneCashAmount = saleInvoices.Where(x => x.PaymentMethod == PaymentMethod.VodafoneCash).Sum(x => x.TotalAmount),
            CheckAmount = saleInvoices.Where(x => x.PaymentMethod == PaymentMethod.Check).Sum(x => x.TotalAmount),
            BankTransferAmount = saleInvoices.Where(x => x.PaymentMethod == PaymentMethod.BankTransfer).Sum(x => x.TotalAmount)
        };
    }

    public async Task CancelInvoiceAsync(int id, int employeeId)
    {
        var invoice = await _context.Invoices
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new NotFoundException("الفاتورة غير موجودة");

        if (invoice.IsCancelled)
            throw new BusinessException("الفاتورة ملغاة بالفعل");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            invoice.IsCancelled = true;

            foreach (var item in invoice.Items)
            {
                var inventory = await _context.BranchInventories
                    .FirstOrDefaultAsync(x => x.ProductId == item.ProductId && x.BranchId == invoice.BranchId);

                if (inventory == null)
                {
                    _context.BranchInventories.Add(new BranchInventory
                    {
                        ProductId = item.ProductId,
                        BranchId = invoice.BranchId,
                        Quantity = item.Quantity,
                        AverageCost = item.CostAtTime
                    });
                }
                else
                {
                    var newAvgCost = ((inventory.Quantity * inventory.AverageCost)
                                   + (item.Quantity * item.CostAtTime))
                                   / (inventory.Quantity + item.Quantity);
                    inventory.Quantity += item.Quantity;
                    inventory.AverageCost = newAvgCost;
                }
            }

            if (invoice.Type == InvoiceType.SaleDeferred)
            {
                var deferred = await _context.DeferredInvoices
                    .FirstOrDefaultAsync(x => x.InvoiceId == id);
                if (deferred != null)
                {
                    var client = await _context.Clients.FindAsync(deferred.ClientId);
                    if (client != null)
                        client.TotalDeferred = Math.Max(0, client.TotalDeferred - deferred.RemainingAmount);

                    deferred.RemainingAmount = 0;
                    deferred.Status = DeferredStatus.Paid;
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<DailyRevenueDto> GetDailyRevenueAllBranchesAsync(DateTime date)
    {
        var branches = await _context.Branches.Where(x => !x.IsAdminBranch).ToListAsync();
        var startOfDay = date.Date;
        var endOfDay = date.Date.AddDays(1);

        var saleInvoices = await _context.Invoices
            .Where(x => x.Type == InvoiceType.Sale
                     && x.CreatedAt >= startOfDay
                     && x.CreatedAt < endOfDay)
            .ToListAsync();

        var returnInvoices = await _context.Invoices
            .Where(x => x.Type == InvoiceType.ReturnSale
                     && x.CreatedAt >= startOfDay
                     && x.CreatedAt < endOfDay)
            .ToListAsync();

        var deferredPayments = await _context.ClientPayments
            .Where(x => x.PaymentDate >= startOfDay
                     && x.PaymentDate < endOfDay)
            .SumAsync(x => x.Amount);

        var totalSales = saleInvoices.Sum(x => x.TotalAmount);
        var totalReturns = returnInvoices.Sum(x => x.TotalAmount);

        return new DailyRevenueDto
        {
            Date = date,
            BranchId = 0,
            TotalSales = totalSales,
            TotalReturns = totalReturns,
            DeferredPayments = deferredPayments,
            NetRevenue = totalSales - totalReturns + deferredPayments,
            InvoicesCount = saleInvoices.Count,
            CashAmount = saleInvoices.Where(x => x.PaymentMethod == PaymentMethod.Cash).Sum(x => x.TotalAmount),
            VodafoneCashAmount = saleInvoices.Where(x => x.PaymentMethod == PaymentMethod.VodafoneCash).Sum(x => x.TotalAmount),
            CheckAmount = saleInvoices.Where(x => x.PaymentMethod == PaymentMethod.Check).Sum(x => x.TotalAmount),
            BankTransferAmount = saleInvoices.Where(x => x.PaymentMethod == PaymentMethod.BankTransfer).Sum(x => x.TotalAmount)
        };
    }

    public async Task<string> GenerateInvoiceNumberAsync(InvoiceType type)
    {
        var prefix = type switch
        {
            InvoiceType.Sale => "INV",
            InvoiceType.SaleDeferred => "DEF",
            InvoiceType.ReturnSale => "RET",
            InvoiceType.ReturnDeferred => "RRD",
            InvoiceType.SupplyAndInstallation => "SUP",
            InvoiceType.ReturnSupplyAndInstallation => "RSU",
            InvoiceType.DeferredPayment => "DPY",
            _ => "INV"
        };

        var year = DateTime.Now.Year;

        var existingNumbers = await _context.Invoices
            .Where(x => x.Type == type && x.CreatedAt.Year == year)
            .Where(x => x.InvoiceNumber.StartsWith(prefix))
            .Select(x => x.InvoiceNumber)
            .ToListAsync();

        int maxNumber = 0;
        foreach (var num in existingNumbers)
        {
            var parts = num.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[^1], out var parsed) && parsed > maxNumber)
                maxNumber = parsed;
        }

        return $"{prefix}-{year}-{(maxNumber + 1):D6}";
    }
}
