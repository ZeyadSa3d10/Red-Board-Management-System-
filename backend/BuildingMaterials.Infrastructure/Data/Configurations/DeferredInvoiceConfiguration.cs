using BuildingMaterials.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingMaterials.Infrastructure.Data.Configurations;

public class DeferredInvoiceConfiguration : IEntityTypeConfiguration<DeferredInvoice>
{
    public void Configure(EntityTypeBuilder<DeferredInvoice> builder)
    {
        builder.Property(x => x.OriginalAmount).HasPrecision(18, 4);
        builder.Property(x => x.PaidAmount).HasPrecision(18, 4);
        builder.Property(x => x.RemainingAmount).HasPrecision(18, 4);
    }
}
