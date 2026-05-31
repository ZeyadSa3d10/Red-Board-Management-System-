using BuildingMaterials.Application.DTOs.Invoice;
using FluentValidation;

namespace BuildingMaterials.Application.Validators;

public class CreateSaleInvoiceValidator : AbstractValidator<CreateSaleInvoiceDto>
{
    public CreateSaleInvoiceValidator()
    {
        RuleFor(x => x.BranchId).GreaterThan(0);
        RuleFor(x => x.Items).NotEmpty().WithMessage("يجب إضافة منتج واحد على الأقل");
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(x => x.ProductId).GreaterThan(0);
            item.RuleFor(x => x.Quantity).GreaterThan(0);
            item.RuleFor(x => x.UnitPrice).GreaterThan(0);
        });
        RuleFor(x => x.PaymentMethod).IsInEnum();
    }
}
