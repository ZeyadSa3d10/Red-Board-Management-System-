using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace BuildingMaterials.Infrastructure.Data;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        var connStr = Environment.GetEnvironmentVariable("ASPNETCORE_CONNECTIONSTRING")
            ?? "Server=localhost;Database=BuildingMaterialsERP;Trusted_Connection=True;TrustServerCertificate=True";
        optionsBuilder.UseSqlServer(connStr);

        return new AppDbContext(optionsBuilder.Options, null!);
    }
}
