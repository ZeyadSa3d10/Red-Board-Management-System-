using AutoMapper;
using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Inventory;
using BuildingMaterials.Application.Services.Interfaces;
using BuildingMaterials.Domain.Entities;
using BuildingMaterials.Domain.Enums;
using BuildingMaterials.Domain.Exceptions;
using BuildingMaterials.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterials.Application.Services;

public class TransferService : ITransferService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public TransferService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<TransferDto> CreateTransferAsync(CreateTransferDto dto, int employeeId)
    {
        if (dto.SourceBranchId == dto.DestinationBranchId)
            throw new BusinessException("لا يمكن التحويل من فرع لنفسه");

        foreach (var item in dto.Items)
        {
            var srcInventory = await _context.BranchInventories
                .FirstOrDefaultAsync(x => x.ProductId == item.ProductId
                                       && x.BranchId == dto.SourceBranchId);

            if (srcInventory == null || srcInventory.Quantity < item.Quantity)
                throw new BusinessException($"الكمية غير كافية في الفرع المصدر");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var transfer = new InventoryTransfer
            {
                TransferNumber = await GenerateTransferNumberAsync(),
                SourceBranchId = dto.SourceBranchId,
                DestinationBranchId = dto.DestinationBranchId,
                Status = TransferStatus.Completed,
                Notes = dto.Notes,
                CreatedByEmployeeId = employeeId,
                ApprovedByEmployeeId = employeeId,
                ApprovedAt = DateTime.UtcNow,
                Items = new List<InventoryTransferItem>()
            };

            foreach (var itemDto in dto.Items)
            {
                var srcInventory = await _context.BranchInventories
                    .FirstAsync(x => x.ProductId == itemDto.ProductId
                                  && x.BranchId == dto.SourceBranchId);

                srcInventory.Quantity -= itemDto.Quantity;

                var dstInventory = await _context.BranchInventories
                    .FirstOrDefaultAsync(x => x.ProductId == itemDto.ProductId
                                           && x.BranchId == dto.DestinationBranchId);

                if (dstInventory == null)
                {
                    _context.BranchInventories.Add(new BranchInventory
                    {
                        ProductId = itemDto.ProductId,
                        BranchId = dto.DestinationBranchId,
                        Quantity = itemDto.Quantity,
                        AverageCost = srcInventory.AverageCost
                    });
                }
                else
                {
                    var newQty = dstInventory.Quantity + itemDto.Quantity;
                    var newAvgCost = ((dstInventory.Quantity * dstInventory.AverageCost)
                                   + (itemDto.Quantity * srcInventory.AverageCost)) / newQty;
                    dstInventory.Quantity = newQty;
                    dstInventory.AverageCost = newAvgCost;
                }

                transfer.Items.Add(new InventoryTransferItem
                {
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    UnitCost = srcInventory.AverageCost
                });
            }

            _context.InventoryTransfers.Add(transfer);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return _mapper.Map<TransferDto>(transfer);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<PagedResult<TransferDto>> GetFilteredAsync(TransferFilterDto filter)
    {
        var query = _context.InventoryTransfers
            .Include(x => x.SourceBranch)
            .Include(x => x.DestinationBranch)
            .Include(x => x.CreatedBy)
            .Include(x => x.Items).ThenInclude(x => x.Product)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var q = filter.Search.ToLower();
            query = query.Where(x => x.TransferNumber.ToLower().Contains(q));
        }
        if (filter.Status.HasValue)
            query = query.Where(x => x.Status == filter.Status.Value);
        if (filter.BranchId.HasValue)
            query = query.Where(x => x.SourceBranchId == filter.BranchId.Value || x.DestinationBranchId == filter.BranchId.Value);
        if (filter.DateFrom.HasValue)
            query = query.Where(x => x.CreatedAt >= filter.DateFrom.Value);
        if (filter.DateTo.HasValue)
            query = query.Where(x => x.CreatedAt <= filter.DateTo.Value);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PagedResult<TransferDto>
        {
            Items = items.Select(t => new TransferDto
            {
                Id = t.Id,
                TransferNumber = t.TransferNumber,
                SourceBranchId = t.SourceBranchId,
                SourceBranchName = t.SourceBranch.Name,
                DestinationBranchId = t.DestinationBranchId,
                DestinationBranchName = t.DestinationBranch.Name,
                Status = t.Status.ToString(),
                Notes = t.Notes,
                CreatedAt = t.CreatedAt,
                CreatedBy = t.CreatedBy.FullName,
                Items = t.Items.Select(i => new TransferItemResponseDto
                {
                    ProductId = i.ProductId,
                    ProductName = i.Product.Name,
                    Quantity = i.Quantity
                }).ToList()
            }).ToList(),
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize
        };
    }

    public async Task<IEnumerable<TransferDto>> GetAllAsync()
    {
        var transfers = await _context.InventoryTransfers
            .Include(x => x.SourceBranch)
            .Include(x => x.DestinationBranch)
            .Include(x => x.CreatedBy)
            .Include(x => x.Items)
            .ThenInclude(x => x.Product)
            .ToListAsync();

        return transfers.Select(t => new TransferDto
        {
            Id = t.Id,
            TransferNumber = t.TransferNumber,
            SourceBranchId = t.SourceBranchId,
            SourceBranchName = t.SourceBranch.Name,
            DestinationBranchId = t.DestinationBranchId,
            DestinationBranchName = t.DestinationBranch.Name,
            Status = t.Status.ToString(),
            Notes = t.Notes,
            CreatedAt = t.CreatedAt,
            CreatedBy = t.CreatedBy.FullName,
            Items = t.Items.Select(i => new TransferItemResponseDto
            {
                ProductId = i.ProductId,
                ProductName = i.Product.Name,
                Quantity = i.Quantity
            }).ToList()
        });
    }

    private async Task<string> GenerateTransferNumberAsync()
    {
        var year = DateTime.Now.Year;
        var count = await _context.InventoryTransfers
            .Where(x => x.CreatedAt.Year == year)
            .CountAsync();
        return $"TRF-{year}-{(count + 1):D6}";
    }
}
