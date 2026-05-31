using BuildingMaterials.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingMaterials.Infrastructure.Data.Configurations;

public class BranchConfiguration : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> builder)
    {
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Location).HasMaxLength(300);
        builder.Property(x => x.Phone).HasMaxLength(20);

        builder.HasOne(x => x.Manager)
               .WithMany()
               .HasForeignKey(x => x.ManagerEmployeeId);

        builder.HasMany(x => x.Employees)
               .WithOne(x => x.Branch)
               .HasForeignKey(x => x.BranchId);
    }
}
