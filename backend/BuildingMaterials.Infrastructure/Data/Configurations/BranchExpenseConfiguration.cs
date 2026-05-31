using BuildingMaterials.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingMaterials.Infrastructure.Data.Configurations;

public class BranchExpenseConfiguration : IEntityTypeConfiguration<BranchExpense>
{
    public void Configure(EntityTypeBuilder<BranchExpense> builder)
    {
        builder.Property(x => x.Description).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Amount).HasPrecision(18, 4).IsRequired();

        builder.HasOne(x => x.Branch)
               .WithMany()
               .HasForeignKey(x => x.BranchId);

        builder.HasOne(x => x.CreatedBy)
               .WithMany()
               .HasForeignKey(x => x.CreatedByEmployeeId);
    }
}
