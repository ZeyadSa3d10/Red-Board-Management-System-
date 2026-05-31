using BuildingMaterials.Application.DTOs.Client;
using FluentValidation;

namespace BuildingMaterials.Application.Validators;

public class CreateClientValidator : AbstractValidator<CreateClientDto>
{
    public CreateClientValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Phone).MaximumLength(20);
        RuleFor(x => x.CreditLimit).GreaterThanOrEqualTo(0);
    }
}
