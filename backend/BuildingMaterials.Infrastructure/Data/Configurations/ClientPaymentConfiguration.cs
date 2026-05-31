using BuildingMaterials.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingMaterials.Infrastructure.Data.Configurations;

public class ClientPaymentConfiguration : IEntityTypeConfiguration<ClientPayment>
{
    public void Configure(EntityTypeBuilder<ClientPayment> builder)
    {
        builder.Property(x => x.Amount).HasPrecision(18, 4);

        builder.HasOne(x => x.ReceivedBy)
               .WithMany()
               .HasForeignKey(x => x.ReceivedById);

        builder.HasOne(x => x.DeferredInvoice)
               .WithMany()
               .HasForeignKey(x => x.DeferredInvoiceId);
    }
}
