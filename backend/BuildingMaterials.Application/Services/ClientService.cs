using AutoMapper;
using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Client;
using BuildingMaterials.Application.Services.Interfaces;
using BuildingMaterials.Domain.Entities;
using BuildingMaterials.Domain.Enums;
using BuildingMaterials.Domain.Exceptions;
using BuildingMaterials.Infrastructure.Data;
using BuildingMaterials.Application.Extensions;
using BuildingMaterials.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterials.Application.Services;

public class ClientService : IClientService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public ClientService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<PagedResult<ClientDto>> GetFilteredAsync(ClientFilterDto filter)
    {
        var query = _context.Clients.AsQueryable()
            .ApplySearch(filter.Search, c => c.Name, c => c.Phone)
            .ApplyWhereIf(filter.HasDeferredOnly == true, c => c.TotalDeferred > 0)
            .ApplyWhereIf(filter.DateFrom.HasValue, c => c.CreatedAt >= filter.DateFrom!.Value)
            .ApplyWhereIf(filter.DateTo.HasValue, c => c.CreatedAt <= filter.DateTo!.Value);

        return await query.ToPagedResultAsync<Client, ClientDto>(filter, _mapper);
    }

    public async Task<IEnumerable<ClientDto>> GetAllAsync()
    {
        var clients = await _context.Clients.ToListAsync();
        return _mapper.Map<IEnumerable<ClientDto>>(clients);
    }

    public async Task<ClientDto> GetByIdAsync(int id)
    {
        var client = await _context.Clients.FindAsync(id)
            ?? throw new NotFoundException("العميل غير موجود");
        return _mapper.Map<ClientDto>(client);
    }

    public async Task<ClientDto> CreateAsync(CreateClientDto dto)
    {
        var client = _mapper.Map<Client>(dto);
        _context.Clients.Add(client);
        await _context.SaveChangesAsync();
        return _mapper.Map<ClientDto>(client);
    }

    public async Task UpdateAsync(int id, UpdateClientDto dto)
    {
        var client = await _context.Clients.FindAsync(id)
            ?? throw new NotFoundException("العميل غير موجود");
        _mapper.Map(dto, client);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<ClientDto>> GetWithDeferredAsync()
    {
        var clients = await _context.Clients
            .Where(x => x.TotalDeferred > 0)
            .ToListAsync();
        return _mapper.Map<IEnumerable<ClientDto>>(clients);
    }

    public async Task<IEnumerable<ClientPaymentResponseDto>> GetPaymentsAsync(int clientId, int? branchId = null)
    {
        var query = _context.ClientPayments
            .Where(x => x.ClientId == clientId);

        if (branchId.HasValue)
            query = query.Where(x => x.BranchId == branchId.Value);

        return await query
            .OrderByDescending(x => x.PaymentDate)
            .Select(x => new ClientPaymentResponseDto
            {
                Id = x.Id,
                Amount = x.Amount,
                PaymentMethod = x.PaymentMethod.ToString(),
                PaymentDate = x.PaymentDate,
                Notes = x.Notes,
            })
            .ToListAsync();
    }

    public async Task AddPaymentAsync(int clientId, ClientPaymentDto dto, int employeeId)
    {
        if (dto.DeferredInvoiceId <= 0)
            throw new BusinessException("معرف الفاتورة الآجلة مطلوب");

        var client = await _context.Clients.FindAsync(clientId)
            ?? throw new NotFoundException("العميل غير موجود");

        var deferred = await _context.DeferredInvoices
            .Include(x => x.Invoice)
            .FirstOrDefaultAsync(x => x.Id == dto.DeferredInvoiceId)
            ?? throw new NotFoundException("الفاتورة الآجلة غير موجودة");

        if (deferred.ClientId != clientId)
            throw new BusinessException("الفاتورة لا تتبع هذا العميل");

        if (dto.Amount > deferred.RemainingAmount)
            throw new BusinessException("المبلغ يتجاوز المتبقي من الفاتورة");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var payment = new ClientPayment
            {
                ClientId = clientId,
                DeferredInvoiceId = dto.DeferredInvoiceId,
                BranchId = deferred.BranchId,
                Amount = dto.Amount,
                PaymentDate = dto.PaymentDate,
                ReceivedByEmployeeId = employeeId,
                ReceivedById = employeeId,
                CheckNumber = dto.CheckNumber,
                Notes = dto.Notes
            };

            if (!Enum.TryParse<PaymentMethod>(dto.PaymentMethod, ignoreCase: true, out var paymentMethod))
                throw new BusinessException($"طريقة دفع غير صالحة: {dto.PaymentMethod}");
            payment.PaymentMethod = paymentMethod;

            deferred.PaidAmount += dto.Amount;
            deferred.RemainingAmount -= dto.Amount;
            deferred.Status = deferred.RemainingAmount <= 0 ? DeferredStatus.Paid : DeferredStatus.Partial;

            client.TotalDeferred = Math.Max(0, client.TotalDeferred - dto.Amount);

            _context.ClientPayments.Add(payment);

            // Create a DeferredPayment invoice to track this payment in the invoice list
            var invCount = await _context.Invoices
                .Where(x => x.Type == InvoiceType.DeferredPayment && x.CreatedAt.Year == DateTime.Now.Year)
                .CountAsync();
            var paymentInvoice = new Invoice
            {
                InvoiceNumber = $"DPY-{DateTime.Now.Year}-{(invCount + 1):D6}",
                Type = InvoiceType.DeferredPayment,
                BranchId = deferred.BranchId,
                ClientId = clientId,
                RelatedInvoiceId = deferred.InvoiceId,
                TotalAmount = dto.Amount,
                PaymentMethod = paymentMethod,
                Notes = $"دفعة على فاتورة آجلة #{deferred.Invoice?.InvoiceNumber ?? deferred.InvoiceId.ToString()}",
                CreatedAt = DateTime.UtcNow,
                CreatedByEmployeeId = employeeId
            };
            _context.Invoices.Add(paymentInvoice);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<ClientStatementDto> GetStatementAsync(int clientId)
    {
        var client = await _context.Clients.FindAsync(clientId)
            ?? throw new NotFoundException("العميل غير موجود");

        var deferredInvoices = await _context.DeferredInvoices
            .Include(x => x.Invoice)
            .Where(x => x.ClientId == clientId)
            .ToListAsync();

        var payments = await _context.ClientPayments
            .Where(x => x.ClientId == clientId)
            .ToListAsync();

        var items = new List<ClientStatementItem>();
        decimal balance = 0;

        foreach (var di in deferredInvoices.OrderBy(x => x.CreatedAt))
        {
            items.Add(new ClientStatementItem
            {
                Date = di.CreatedAt,
                Description = $"فاتورة آجلة #{di.Invoice.InvoiceNumber}",
                Debit = di.OriginalAmount,
                Credit = 0,
                Balance = balance + di.OriginalAmount
            });
            balance += di.OriginalAmount;
        }

        foreach (var p in payments.OrderBy(x => x.PaymentDate))
        {
            items.Add(new ClientStatementItem
            {
                Date = p.PaymentDate,
                Description = $"دفعة - {p.PaymentMethod}",
                Debit = 0,
                Credit = p.Amount,
                Balance = Math.Max(0, balance - p.Amount)
            });
            balance = Math.Max(0, balance - p.Amount);
        }

        return new ClientStatementDto
        {
            ClientId = clientId,
            ClientName = client.Name,
            Items = items.OrderBy(x => x.Date).ToList()
        };
    }
}
