using BuildingMaterials.Application.DTOs.Auth;
using FluentValidation;

namespace BuildingMaterials.Application.Validators;

public class ChangePasswordValidator : AbstractValidator<ChangePasswordDto>
{
    public ChangePasswordValidator()
    {
        RuleFor(x => x.OldPassword).NotEmpty().WithMessage("كلمة المرور القديمة مطلوبة");
        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("كلمة المرور الجديدة مطلوبة")
            .MinimumLength(8).WithMessage("يجب أن تكون كلمة المرور 8 أحرف على الأقل")
            .Matches("[A-Z]").WithMessage("يجب أن تحتوي على حرف كبير")
            .Matches("[0-9]").WithMessage("يجب أن تحتوي على رقم")
            .NotEqual(x => x.OldPassword).WithMessage("يجب أن تختلف كلمة المرور الجديدة عن القديمة");
    }
}
