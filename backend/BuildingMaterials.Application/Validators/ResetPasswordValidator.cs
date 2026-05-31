using BuildingMaterials.Application.DTOs.Employee;
using FluentValidation;

namespace BuildingMaterials.Application.Validators;

public class ResetPasswordValidator : AbstractValidator<ResetPasswordDto>
{
    public ResetPasswordValidator()
    {
        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("كلمة المرور الجديدة مطلوبة")
            .MinimumLength(8).WithMessage("يجب أن تكون كلمة المرور 8 أحرف على الأقل")
            .Matches("[A-Z]").WithMessage("يجب أن تحتوي على حرف كبير")
            .Matches("[0-9]").WithMessage("يجب أن تحتوي على رقم");
    }
}
