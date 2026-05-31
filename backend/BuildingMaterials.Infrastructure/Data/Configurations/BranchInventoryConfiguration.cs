using BuildingMaterials.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingMaterials.Infrastructure.Data.Configurations;

public class BranchInventoryConfiguration : IEntityTypeConfiguration<BranchInventory>
{
    public void Configure(EntityTypeBuilder<BranchInventory> builder)
    {
        builder.HasIndex(x => new { x.ProductId, x.BranchId }).IsUnique();

        builder.Property(x => x.Quantity).HasPrecision(18, 4);
        builder.Property(x => x.AverageCost).HasPrecision(18, 4);
    }
}
