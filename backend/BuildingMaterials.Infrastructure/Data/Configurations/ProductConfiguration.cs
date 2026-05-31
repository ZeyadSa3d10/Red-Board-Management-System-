using BuildingMaterials.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingMaterials.Infrastructure.Data.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Barcode).HasMaxLength(50);
        builder.Property(x => x.Unit).HasMaxLength(50).IsRequired();
        builder.Property(x => x.PurchasePrice).HasPrecision(18, 4);
        builder.Property(x => x.MinSalePrice).HasPrecision(18, 4);
        builder.Property(x => x.CurrentSalePrice).HasPrecision(18, 4);

        builder.HasIndex(x => x.Barcode).IsUnique().HasFilter("[Barcode] IS NOT NULL");
    }
}
