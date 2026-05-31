using BuildingMaterials.Application.DTOs.Auth;
using FluentValidation;

namespace BuildingMaterials.Application.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequestDto>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Phone).NotEmpty().WithMessage("رقم الهاتف مطلوب");
        RuleFor(x => x.Password).NotEmpty().WithMessage("كلمة المرور مطلوبة");
    }
}
