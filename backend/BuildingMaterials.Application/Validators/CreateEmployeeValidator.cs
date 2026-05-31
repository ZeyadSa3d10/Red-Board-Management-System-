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
            .MinimumLength(8).WithMessage("يجب أن تكون كلمة المرور 8 أحرف على الأقل")
            .Matches("[A-Z]").WithMessage("يجب أن تحتوي على حرف كبير")
            .Matches("[0-9]").WithMessage("يجب أن تحتوي على رقم");
        RuleFor(x => x.Role).NotEmpty();
        RuleFor(x => x.NationalId)
            .NotEmpty().WithMessage("الرقم القومي مطلوب")
            .Length(14).WithMessage("يجب أن يتكون الرقم القومي من 14 رقمًا")
            .Matches("^[0-9]{14}$").WithMessage("الرقم القومي يجب أن يتكون من أرقام فقط");
    }
}
