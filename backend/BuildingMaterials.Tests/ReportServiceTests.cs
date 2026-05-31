using BuildingMaterials.Application.DTOs.Report;
using BuildingMaterials.Application.Services;
using BuildingMaterials.Domain.Entities;
using BuildingMaterials.Domain.Enums;
using BuildingMaterials.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterials.Tests;

public class ReportServiceTests
{
    private AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetOwnerDashboardStatsAsync_ReturnsCorrectStats()
    {
        var context = CreateContext();
        SeedBasicData(context);

        var mapper = TestHelper.CreateMapper();
        var service = new ReportService(context, mapper);

        var stats = await service.GetOwnerDashboardStatsAsync();

        stats.Should().NotBeNull();
        stats.TotalInvoicesCount.Should().Be(2);
        stats.MonthlyRevenue.Should().BeGreaterThan(0);
        stats.MonthlyData.Should().NotBeNull();
        stats.MonthlyData.Count.Should().Be(6);
    }

    [Fact]
    public async Task GetTopProductsAsync_ReturnsOrderedResults()
    {
        var context = CreateContext();
        SeedBasicData(context);

        var mapper = TestHelper.CreateMapper();
        var service = new ReportService(context, mapper);

        var topProducts = await service.GetTopProductsAsync(10);
        topProducts.Should().NotBeNull();
        topProducts.Should().BeInDescendingOrder(x => x.TotalRevenue);
    }

    [Fact]
    public async Task GetInventoryValueAsync_ReturnsValues()
    {
        var context = CreateContext();
        SeedBasicData(context);

        var mapper = TestHelper.CreateMapper();
        var service = new ReportService(context, mapper);

        var values = await service.GetInventoryValueAsync();
        values.Should().NotBeNull();
        values.Should().NotBeEmpty();
        values.First().TotalQuantity.Should().Be(100);
    }

    private void SeedBasicData(AppDbContext context)
    {
        var branch = new Branch { Name = "Test Branch", IsAdminBranch = false };
        context.Branches.Add(branch);
        context.SaveChanges();

        var cat = new Category { Name = "Test" };
        context.Categories.Add(cat);
        context.SaveChanges();

        var product = new Product
        {
            Name = "Test Product", Unit = "طن", CurrentSalePrice = 1000, MinSalePrice = 900,
            MinStockAlert = 5, CategoryId = 1, IsActive = true
        };
        context.Products.Add(product);
        context.SaveChanges();

        context.BranchInventories.Add(new BranchInventory
        {
            ProductId = 1, BranchId = 1, Quantity = 100, AverageCost = 800
        });
        context.SaveChanges();

        var inv1 = new Invoice
        {
            InvoiceNumber = "INV-001", Type = InvoiceType.Sale, BranchId = 1,
            TotalAmount = 5000, Subtotal = 5000, CreatedAt = DateTime.UtcNow,
            CreatedByEmployeeId = 1
        };
        context.Invoices.Add(inv1);
        context.SaveChanges();

        context.InvoiceItems.Add(new InvoiceItem
        {
            InvoiceId = 1, ProductId = 1, Quantity = 5, UnitPrice = 1000,
            TotalPrice = 5000, CostAtTime = 800
        });
        context.SaveChanges();

        var inv2 = new Invoice
        {
            InvoiceNumber = "INV-002", Type = InvoiceType.SaleDeferred, BranchId = 1,
            TotalAmount = 3000, Subtotal = 3000, CreatedAt = DateTime.UtcNow,
            CreatedByEmployeeId = 1
        };
        context.Invoices.Add(inv2);
        context.SaveChanges();

        context.InvoiceItems.Add(new InvoiceItem
        {
            InvoiceId = 2, ProductId = 1, Quantity = 3, UnitPrice = 1000,
            TotalPrice = 3000, CostAtTime = 800
        });
        context.SaveChanges();
    }
}

public static class TestHelper
{
    public static AutoMapper.IMapper CreateMapper()
    {
        var config = new AutoMapper.MapperConfiguration(cfg =>
        {
            cfg.AddProfile<BuildingMaterials.Application.Mappings.AutoMapperProfile>();
        });
        return config.CreateMapper();
    }
}
