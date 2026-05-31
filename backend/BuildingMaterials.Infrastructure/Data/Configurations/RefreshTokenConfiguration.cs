using BuildingMaterials.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingMaterials.Infrastructure.Data.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.Property(x => x.Token).HasMaxLength(500).IsRequired();
        builder.Property(x => x.ExpiresAt).IsRequired();

        builder.HasIndex(x => x.Token).IsUnique();
        builder.HasIndex(x => x.EmployeeId);

        builder.HasOne(x => x.Employee)
               .WithMany()
               .HasForeignKey(x => x.EmployeeId);
    }
}
