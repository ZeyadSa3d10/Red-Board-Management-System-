using BuildingMaterials.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingMaterials.Infrastructure.Data.Configurations;

public class PurchaseInvoiceConfiguration : IEntityTypeConfiguration<PurchaseInvoice>
{
    public void Configure(EntityTypeBuilder<PurchaseInvoice> builder)
    {
        builder.Property(x => x.InvoiceNumber).HasMaxLength(30).IsRequired();
        builder.HasIndex(x => x.InvoiceNumber).IsUnique();
        builder.Property(x => x.TotalAmount).HasPrecision(18, 4);
        builder.Property(x => x.TransportCost).HasPrecision(18, 4);
        builder.Property(x => x.PaidAmount).HasPrecision(18, 4);
        builder.Property(x => x.RemainingAmount).HasPrecision(18, 4);
        builder.Property(x => x.ProjectName).HasMaxLength(200);
    }
}
