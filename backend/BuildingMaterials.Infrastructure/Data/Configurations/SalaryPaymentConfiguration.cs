using BuildingMaterials.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingMaterials.Infrastructure.Data.Configurations;

public class SalaryPaymentConfiguration : IEntityTypeConfiguration<SalaryPayment>
{
    public void Configure(EntityTypeBuilder<SalaryPayment> builder)
    {
        builder.Property(x => x.Amount).HasPrecision(18, 4);
    }
}
