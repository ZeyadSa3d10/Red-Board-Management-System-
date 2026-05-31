using BuildingMaterials.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingMaterials.Infrastructure.Data.Configurations;

public class SalaryAdvanceConfiguration : IEntityTypeConfiguration<SalaryAdvance>
{
    public void Configure(EntityTypeBuilder<SalaryAdvance> builder)
    {
        builder.Property(x => x.Amount).HasPrecision(18, 4);
    }
}
