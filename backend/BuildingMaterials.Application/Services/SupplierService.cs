using AutoMapper;
using BuildingMaterials.Application.DTOs;
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

public class SupplierService : ISupplierService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public SupplierService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<PagedResult<SupplierDto>> GetFilteredAsync(SupplierFilterDto filter)
    {
        var query = _context.Suppliers.Include(x => x.Category).AsQueryable()
            .ApplySearch(filter.Search, s => s.Name, s => s.Phone)
            .ApplyWhereIf(filter.HasDueOnly == true, s => s.TotalDue > 0)
            .ApplyWhereIf(filter.DateFrom.HasValue, s => s.CreatedAt >= filter.DateFrom!.Value)
            .ApplyWhereIf(filter.DateTo.HasValue, s => s.CreatedAt <= filter.DateTo!.Value);

        return await query.ToPagedResultAsync<Supplier, SupplierDto>(filter, _mapper);
    }

    public async Task<IEnumerable<SupplierDto>> GetAllAsync()
    {
        var suppliers = await _context.Suppliers.Include(x => x.Category).ToListAsync();
        return _mapper.Map<IEnumerable<SupplierDto>>(suppliers);
    }

    public async Task<SupplierDto> GetByIdAsync(int id)
    {
        var supplier = await _context.Suppliers.Include(x => x.Category).FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new NotFoundException("المورد غير موجود");
        return _mapper.Map<SupplierDto>(supplier);
    }

    public async Task<SupplierDto> CreateAsync(CreateSupplierDto dto)
    {
        var supplier = _mapper.Map<Supplier>(dto);
        _context.Suppliers.Add(supplier);
        await _context.SaveChangesAsync();
        return _mapper.Map<SupplierDto>(supplier);
    }

    public async Task UpdateAsync(int id, UpdateSupplierDto dto)
    {
        var supplier = await _context.Suppliers.FindAsync(id)
            ?? throw new NotFoundException("المورد غير موجود");
        _mapper.Map(dto, supplier);
        await _context.SaveChangesAsync();
    }

    public async Task AddPaymentAsync(int supplierId, SupplierIndependentPaymentDto dto, int employeeId)
    {
        var supplier = await _context.Suppliers.FindAsync(supplierId)
            ?? throw new NotFoundException("المورد غير موجود");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            if (!Enum.TryParse<PaymentMethod>(dto.PaymentMethod, out var paymentMethod))
                throw new BusinessException($"طريقة دفع غير صالحة: {dto.PaymentMethod}");

            var payment = new SupplierPayment
            {
                SupplierId = supplierId,
                PurchaseInvoiceId = null,
                Amount = dto.Amount,
                PaymentMethod = paymentMethod,
                PaymentDate = dto.PaymentDate,
                CheckNumber = dto.CheckNumber,
                PaidByEmployeeId = employeeId,
                PaidById = employeeId,
                Notes = dto.Notes
            };

            supplier.TotalPaid += dto.Amount;
            supplier.TotalDue = Math.Max(0, supplier.TotalDue - dto.Amount);

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

    public async Task<SupplierStatementDto> GetStatementAsync(int supplierId)
    {
        var supplier = await _context.Suppliers.FindAsync(supplierId)
            ?? throw new NotFoundException("المورد غير موجود");

        var purchases = await _context.PurchaseInvoices
            .Where(x => x.SupplierId == supplierId)
            .ToListAsync();

        var payments = await _context.SupplierPayments
            .Where(x => x.SupplierId == supplierId)
            .ToListAsync();

        var items = new List<SupplierStatementItem>();
        decimal balance = 0;

        foreach (var p in purchases.OrderBy(x => x.CreatedAt))
        {
            items.Add(new SupplierStatementItem
            {
                Date = p.CreatedAt,
                Description = $"فاتورة مشتريات #{p.InvoiceNumber}",
                Debit = p.TotalAmount,
                Credit = 0,
                Balance = balance + p.TotalAmount
            });
            balance += p.TotalAmount;
        }

        foreach (var p in payments.OrderBy(x => x.PaymentDate))
        {
            items.Add(new SupplierStatementItem
            {
                Date = p.PaymentDate,
                Description = $"دفعة - {p.PaymentMethod}",
                Debit = 0,
                Credit = p.Amount,
                Balance = Math.Max(0, balance - p.Amount)
            });
            balance = Math.Max(0, balance - p.Amount);
        }

        return new SupplierStatementDto
        {
            SupplierId = supplierId,
            SupplierName = supplier.Name,
            Items = items.OrderBy(x => x.Date).ToList()
        };
    }
}
