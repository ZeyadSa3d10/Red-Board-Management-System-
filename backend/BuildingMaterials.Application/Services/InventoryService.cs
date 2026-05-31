using AutoMapper;
using BuildingMaterials.Application.DTOs.Inventory;
using BuildingMaterials.Application.Services.Interfaces;
using BuildingMaterials.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterials.Application.Services;

public class InventoryService : IInventoryService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public InventoryService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<InventoryDto>> GetAllAsync()
    {
        var inventories = await _context.BranchInventories
            .Include(x => x.Product)
            .Include(x => x.Branch)
            .ToListAsync();
        return _mapper.Map<IEnumerable<InventoryDto>>(inventories);
    }

    public async Task<IEnumerable<InventoryDto>> GetByBranchIdAsync(int branchId)
    {
        var inventories = await _context.BranchInventories
            .Include(x => x.Product)
            .Include(x => x.Branch)
            .Where(x => x.BranchId == branchId)
            .ToListAsync();
        return _mapper.Map<IEnumerable<InventoryDto>>(inventories);
    }

    public async Task<IEnumerable<LowStockDto>> GetLowStockAsync()
    {
        var lowStock = await _context.BranchInventories
            .Include(x => x.Product)
            .Include(x => x.Branch)
            .Where(x => x.Quantity <= x.Product.MinStockAlert)
            .Select(x => new LowStockDto
            {
                ProductId = x.ProductId,
                ProductName = x.Product.Name,
                BranchId = x.BranchId,
                BranchName = x.Branch.Name,
                Quantity = x.Quantity,
                MinStockAlert = x.Product.MinStockAlert
            })
            .ToListAsync();
        return lowStock;
    }

    public async Task<IEnumerable<InventoryMatrixDto>> GetMatrixAsync()
    {
        var products = await _context.Products.ToListAsync();
        var inventories = await _context.BranchInventories
            .Include(x => x.Branch)
            .Include(x => x.Product)
            .ToListAsync();
        var branches = await _context.Branches.Where(x => !x.IsAdminBranch).ToListAsync();

        var matrix = new List<InventoryMatrixDto>();

        foreach (var product in products.OrderBy(x => x.Name))
        {
            var productInventories = inventories.Where(x => x.ProductId == product.Id).ToList();
            var totalQty = (int)productInventories.Sum(x => x.Quantity);

            var branchStocks = branches.Select(b =>
            {
                var inv = productInventories.FirstOrDefault(x => x.BranchId == b.Id);
                return new BranchStockDto
                {
                    BranchId = b.Id,
                    BranchName = b.Name,
                    Quantity = inv?.Quantity ?? 0,
                    AverageCost = inv?.AverageCost ?? 0
                };
            }).ToList();

            matrix.Add(new InventoryMatrixDto
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Barcode = product.Barcode,
                Unit = product.Unit,
                PurchasePrice = product.PurchasePrice,
                SalePrice = product.CurrentSalePrice,
                MinStockAlert = product.MinStockAlert,
                TotalQuantity = totalQty,
                BranchStocks = branchStocks
            });
        }

        return matrix;
    }

    public async Task<LowStockCountDto> GetLowStockCountAsync()
    {
        var count = await _context.Products
            .CountAsync(x => x.MinStockAlert > 0 && x.BranchInventories.Sum(b => b.Quantity) <= x.MinStockAlert);

        return new LowStockCountDto { Count = count };
    }
}
