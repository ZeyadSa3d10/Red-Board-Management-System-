using BuildingMaterials.Domain.Entities.Base;
using BuildingMaterials.Domain.Enums;

namespace BuildingMaterials.Domain.Entities;

public class DeferredInvoice : BaseEntity
{
    public int ClientId { get; set; }
    public Client Client { get; set; }

    public int InvoiceId { get; set; }
    public Invoice Invoice { get; set; }

    public int BranchId { get; set; }
    public Branch Branch { get; set; }

    public decimal OriginalAmount { get; set; }
    public decimal PaidAmount { get; set; } = 0;
    public decimal RemainingAmount { get; set; }
    public DateTime? DueDate { get; set; }
    public DeferredStatus Status { get; set; } = DeferredStatus.Unpaid;
}
