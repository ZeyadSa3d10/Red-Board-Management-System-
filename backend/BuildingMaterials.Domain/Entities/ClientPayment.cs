using BuildingMaterials.Domain.Entities.Base;
using BuildingMaterials.Domain.Enums;

namespace BuildingMaterials.Domain.Entities;

public class ClientPayment : BaseEntity
{
    public int ClientId { get; set; }
    public Client Client { get; set; }

    public int DeferredInvoiceId { get; set; }
    public DeferredInvoice DeferredInvoice { get; set; }

    public int BranchId { get; set; }
    public Branch Branch { get; set; }

    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public DateTime PaymentDate { get; set; }
    public int ReceivedByEmployeeId { get; set; }
    public int ReceivedById { get; set; }
    public Employee ReceivedBy { get; set; }
    public string? Notes { get; set; }
    public string? CheckNumber { get; set; }
}
