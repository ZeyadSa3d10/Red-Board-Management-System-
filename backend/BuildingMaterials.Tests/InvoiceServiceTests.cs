using BuildingMaterials.Application.DTOs.Invoice;
using BuildingMaterials.Application.Services;
using BuildingMaterials.Domain.Entities;
using BuildingMaterials.Domain.Enums;
using BuildingMaterials.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterials.Tests;

public class InvoiceServiceTests
{
    private AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateSaleInvoice_WithValidData_Succeeds()
    {
        var context = CreateContext();
        SeedData(context);

        var service = new InvoiceService(context, null!);

        var branch = await context.Branches.FirstAsync();
        var product = await context.Products.FirstAsync();
        var inv = await context.BranchInventories.FirstAsync();

        var dto = new CreateSaleInvoiceDto
        {
            BranchId = branch.Id,
            Items = new List<CreateInvoiceItemDto>
            {
                new() { ProductId = product.Id, Quantity = 2, UnitPrice = 1500 }
            },
            PaymentMethod = PaymentMethod.Cash,
            Discount = 0,
            Notes = "Test"
        };

        var result = await service.CreateSaleInvoiceAsync(dto, 1);
        result.Should().NotBeNull();
        result.InvoiceNumber.Should().StartWith("INV");
    }

    [Fact]
    public async Task CancelInvoice_MarksAsCancelled()
    {
        var context = CreateContext();
        SeedData(context);

        var service = new InvoiceService(context, null!);

        var invoice = new Invoice
        {
            InvoiceNumber = "TEST-001",
            Type = InvoiceType.Sale,
            BranchId = 1,
            TotalAmount = 1000,
            CreatedAt = DateTime.UtcNow,
            CreatedByEmployeeId = 1
        };
        context.Invoices.Add(invoice);
        await context.SaveChangesAsync();

        await service.CancelInvoiceAsync(invoice.Id, 1);

        var cancelled = await context.Invoices.FindAsync(invoice.Id);
        cancelled!.IsCancelled.Should().BeTrue();
    }

    private void SeedData(AppDbContext context)
    {
        context.Branches.Add(new Branch { Name = "Test Branch", IsAdminBranch = false });
        context.Products.Add(new Product { Name = "Test Product", Unit = "طن", CurrentSalePrice = 1500, MinSalePrice = 1400, MinStockAlert = 5, CategoryId = 1, IsActive = true });
        context.Categories.Add(new Category { Name = "Test Category" });
        context.BranchInventories.Add(new BranchInventory { ProductId = 1, BranchId = 1, Quantity = 100, AverageCost = 1200 });
        context.SaveChanges();
    }
}
