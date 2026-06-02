using BuildingMaterials.Application.DTOs.Employee;
using FluentValidation;

namespace BuildingMaterials.Application.Validators;

public class CreateEmployeeValidator : AbstractValidator<CreateEmployeeDto>
{
    public CreateEmployeeValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().WithMessage("الاسم مطلوب");
        RuleFor(x => x.Phone).NotEmpty().WithMessage("رقم الهاتف مطلوب");
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("كلمة المرور مطلوبة")
            .MinimumLength(6).WithMessage("يجب أن تكون كلمة المرور 6 أحرف على الأقل");
        RuleFor(x => x.Role).NotEmpty();
        RuleFor(x => x.NationalId)
            .Matches("^[0-9]{14}$").WithMessage("الرقم القومي يجب أن يتكون من 14 رقمًا")
            .When(x => !string.IsNullOrEmpty(x.NationalId));
    }
}
