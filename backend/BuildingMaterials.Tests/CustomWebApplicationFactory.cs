using BuildingMaterials.API;
using BuildingMaterials.Domain.Entities;
using BuildingMaterials.Domain.Enums;
using BuildingMaterials.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingMaterials.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (descriptor != null)
                services.Remove(descriptor);

            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase("TestDb");
            });

            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();
            SeedTestData(db);
        });
    }

    private static void SeedTestData(AppDbContext db)
    {
        if (!db.Branches.Any())
        {
            db.Branches.Add(new Branch { Name = "الفرع الرئيسي", Location = "القاهرة", IsAdminBranch = true });
            db.SaveChanges();
        }

        if (!db.Employees.Any())
        {
            db.Employees.Add(new Employee
            {
                FullName = "المدير",
                Phone = "01000000001",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Owner123"),
                NationalId = "1234567890",
                Role = EmployeeRole.Owner,
                IsActive = true,
                JoinDate = DateTime.UtcNow,
                BranchId = 1
            });
            db.SaveChanges();
        }

        if (!db.Categories.Any())
        {
            db.Categories.Add(new Category { Name = "أسمنت" });
            db.SaveChanges();
        }

        if (!db.Products.Any())
        {
            db.Products.Add(new Product
            {
                Name = "أسمنت بورتلاند",
                Unit = "طن",
                CurrentSalePrice = 1500,
                MinSalePrice = 1400,
                MinStockAlert = 10,
                CategoryId = 1,
                IsActive = true
            });
            db.SaveChanges();
        }
    }
}
