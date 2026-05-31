using BuildingMaterials.Application.DTOs.Purchase;
using FluentValidation;

namespace BuildingMaterials.Application.Validators;

public class CreatePurchaseInvoiceValidator : AbstractValidator<CreatePurchaseInvoiceDto>
{
    public CreatePurchaseInvoiceValidator()
    {
        RuleFor(x => x.SupplierId).GreaterThan(0);
        RuleFor(x => x.BranchId).GreaterThan(0);
        RuleFor(x => x.Items).NotEmpty().WithMessage("يجب إضافة منتج واحد على الأقل");
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(x => x.ProductId).GreaterThan(0);
            item.RuleFor(x => x.Quantity).GreaterThan(0);
            item.RuleFor(x => x.UnitCost).GreaterThan(0);
        });
        RuleFor(x => x.InvoiceDate).NotEmpty();
    }
}
