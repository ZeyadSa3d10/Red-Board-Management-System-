using AutoMapper;
using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Product;
using BuildingMaterials.Application.Services.Interfaces;
using BuildingMaterials.Domain.Entities;
using BuildingMaterials.Domain.Exceptions;
using BuildingMaterials.Infrastructure.Data;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterials.Application.Services;

public class ProductService : IProductService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public ProductService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<PagedResult<ProductDto>> GetFilteredAsync(ProductFilterDto filter)
    {
        var query = _context.Products.Include(x => x.Category).AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var q = filter.Search.ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(q) || (x.Barcode != null && x.Barcode.Contains(q)));
        }
        if (filter.CategoryId.HasValue)
            query = query.Where(x => x.CategoryId == filter.CategoryId.Value);
        if (filter.BranchId.HasValue)
            query = query.Where(x => x.BranchInventories.Any(i => i.BranchId == filter.BranchId.Value));

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PagedResult<ProductDto>
        {
            Items = _mapper.Map<List<ProductDto>>(items),
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize
        };
    }

    public async Task<IEnumerable<ProductDto>> GetAllAsync()
    {
        var products = await _context.Products.Include(x => x.Category).ToListAsync();
        return _mapper.Map<IEnumerable<ProductDto>>(products);
    }

    public async Task<ProductDto> GetByIdAsync(int id)
    {
        var product = await _context.Products.Include(x => x.Category).FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new NotFoundException("المنتج غير موجود");
        return _mapper.Map<ProductDto>(product);
    }

    public async Task<ProductDto> CreateAsync(CreateProductDto dto)
    {
        var product = _mapper.Map<Product>(dto);
        product.IsActive = true;
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        if (dto.InitialQuantities != null && dto.InitialQuantities.Any())
        {
            foreach (var iq in dto.InitialQuantities)
            {
                if (iq.Quantity > 0)
                {
                    _context.BranchInventories.Add(new BranchInventory
                    {
                        ProductId = product.Id,
                        BranchId = iq.BranchId,
                        Quantity = iq.Quantity,
                        AverageCost = iq.AverageCost
                    });
                }
            }
            await _context.SaveChangesAsync();
        }

        return _mapper.Map<ProductDto>(product);
    }

    public async Task UpdateAsync(int id, CreateProductDto dto)
    {
        var product = await _context.Products.Include(x => x.BranchInventories).FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new NotFoundException("المنتج غير موجود");

        _mapper.Map(dto, product);

        if (dto.InitialQuantities != null)
        {
            foreach (var iq in dto.InitialQuantities)
            {
                var inventory = product.BranchInventories.FirstOrDefault(x => x.BranchId == iq.BranchId);
                if (inventory != null)
                {
                    inventory.Quantity = iq.Quantity;
                    inventory.AverageCost = iq.AverageCost;
                }
                else if (iq.Quantity > 0)
                {
                    _context.BranchInventories.Add(new BranchInventory
                    {
                        ProductId = product.Id,
                        BranchId = iq.BranchId,
                        Quantity = iq.Quantity,
                        AverageCost = iq.AverageCost
                    });
                }
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var product = await _context.Products.FindAsync(id)
            ?? throw new NotFoundException("المنتج غير موجود");
        
        // Soft delete or Hard delete? User said "احذف المنتج". 
        // I'll check if there are invoices/transactions. If so, maybe soft delete.
        // But for simplicity and based on "delete", I'll try to remove it.
        // Actually, in many ERPs, we just deactivate or remove if no history.
        // I'll do a hard delete for now, but usually we check for references.
        
        var hasTransactions = await _context.InvoiceItems.AnyAsync(x => x.ProductId == id) ||
                             await _context.PurchaseInvoiceItems.AnyAsync(x => x.ProductId == id);
        
        if (hasTransactions)
        {
            product.IsActive = false;
        }
        else
        {
            var inventories = await _context.BranchInventories.Where(x => x.ProductId == id).ToListAsync();
            _context.BranchInventories.RemoveRange(inventories);
            _context.Products.Remove(product);
        }
        
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<CategoryDto>> GetCategoriesAsync()
    {
        var categories = await _context.Categories.ToListAsync();
        return categories.Select(x => new CategoryDto { Id = x.Id, Name = x.Name });
    }

    public async Task<IEnumerable<ProductDto>> GetByBranchIdAsync(int branchId)
    {
        var inventories = await _context.BranchInventories
            .Include(x => x.Product).ThenInclude(x => x.Category)
            .Where(x => x.BranchId == branchId)
            .ToListAsync();

        var products = inventories.Select(x => x.Product).Distinct();
        return _mapper.Map<IEnumerable<ProductDto>>(products);
    }
}
