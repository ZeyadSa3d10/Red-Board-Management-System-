using BuildingMaterials.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingMaterials.Infrastructure.Data.Configurations;

public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.Property(x => x.InvoiceNumber).HasMaxLength(30).IsRequired();
        builder.HasIndex(x => x.InvoiceNumber).IsUnique();

        builder.Property(x => x.Subtotal).HasPrecision(18, 4);
        builder.Property(x => x.Discount).HasPrecision(18, 4);
        builder.Property(x => x.TransportCost).HasPrecision(18, 4);
        builder.Property(x => x.TotalAmount).HasPrecision(18, 4);
        builder.Property(x => x.PaymentReference).HasMaxLength(100);
        builder.Property(x => x.ReturnReason).HasMaxLength(500);

        builder.HasOne(x => x.RelatedInvoice)
               .WithMany()
               .HasForeignKey(x => x.RelatedInvoiceId);

        builder.HasOne(x => x.Branch)
               .WithMany(x => x.Invoices)
               .HasForeignKey(x => x.BranchId);

        builder.HasOne(x => x.CreatedBy)
               .WithMany()
               .HasForeignKey(x => x.CreatedByEmployeeId);

    }
}
