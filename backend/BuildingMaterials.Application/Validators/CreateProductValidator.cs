using BuildingMaterials.Application.DTOs.Product;
using FluentValidation;

namespace BuildingMaterials.Application.Validators;

public class CreateProductValidator : AbstractValidator<CreateProductDto>
{
    public CreateProductValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.CurrentSalePrice).GreaterThan(0);
        RuleFor(x => x.MinSalePrice).GreaterThan(0)
            .LessThanOrEqualTo(x => x.CurrentSalePrice);
        RuleFor(x => x.CategoryId).GreaterThan(0);
    }
}
