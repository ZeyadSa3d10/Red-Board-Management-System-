using BuildingMaterials.Domain.Entities.Base;

namespace BuildingMaterials.Domain.Entities;

public class Client : BaseEntity
{
    public string Name { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public bool IsCompany { get; set; } = false;

    public decimal TotalDeferred { get; set; } = 0;
    public decimal CreditLimit { get; set; } = 0;

    public ICollection<DeferredInvoice> DeferredInvoices { get; set; }
    public ICollection<ClientPayment> Payments { get; set; }
}
