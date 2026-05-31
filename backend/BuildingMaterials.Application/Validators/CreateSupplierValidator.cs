using BuildingMaterials.Application.DTOs.Supplier;
using FluentValidation;

namespace BuildingMaterials.Application.Validators;

public class CreateSupplierValidator : AbstractValidator<CreateSupplierDto>
{
    public CreateSupplierValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Address).MaximumLength(500);
    }
}
