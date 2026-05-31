namespace BuildingMaterials.Domain.Enums;

public enum InvoiceType
{
    Sale = 1,
    SaleDeferred = 2,
    ReturnSale = 3,
    ReturnDeferred = 4,
    SupplyAndInstallation = 5,
    ReturnSupplyAndInstallation = 6,
    Transfer = 7,
    DeferredPayment = 8
}
