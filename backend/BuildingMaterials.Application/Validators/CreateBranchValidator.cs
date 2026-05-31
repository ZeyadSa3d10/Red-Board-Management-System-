using BuildingMaterials.Application.DTOs.Branch;
using FluentValidation;

namespace BuildingMaterials.Application.Validators;

public class CreateBranchValidator : AbstractValidator<CreateBranchDto>
{
    public CreateBranchValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Location).MaximumLength(500);
    }
}
