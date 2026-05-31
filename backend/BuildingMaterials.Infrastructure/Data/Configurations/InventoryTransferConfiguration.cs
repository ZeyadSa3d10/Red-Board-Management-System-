using BuildingMaterials.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingMaterials.Infrastructure.Data.Configurations;

public class InventoryTransferConfiguration : IEntityTypeConfiguration<InventoryTransfer>
{
    public void Configure(EntityTypeBuilder<InventoryTransfer> builder)
    {
        builder.Property(x => x.TransferNumber).HasMaxLength(30).IsRequired();
        builder.HasIndex(x => x.TransferNumber).IsUnique();

        builder.HasOne(x => x.SourceBranch)
               .WithMany()
               .HasForeignKey(x => x.SourceBranchId);

        builder.HasOne(x => x.DestinationBranch)
               .WithMany()
               .HasForeignKey(x => x.DestinationBranchId);

        builder.HasOne(x => x.CreatedBy)
               .WithMany()
               .HasForeignKey(x => x.CreatedByEmployeeId);

        builder.HasOne(x => x.ApprovedBy)
               .WithMany()
               .HasForeignKey(x => x.ApprovedByEmployeeId);
    }
}
