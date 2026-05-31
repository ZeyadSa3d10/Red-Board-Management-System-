using BuildingMaterials.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingMaterials.Infrastructure.Data.Configurations;

public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.Property(x => x.FullName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        builder.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
        builder.Property(x => x.NationalId).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Salary).HasPrecision(18, 4);
        builder.Property(x => x.SalaryType).HasConversion<int>();

        builder.HasIndex(x => x.Phone).IsUnique();

        builder.HasMany(x => x.SalaryPayments)
               .WithOne(x => x.Employee)
               .HasForeignKey(x => x.EmployeeId);
    }
}
