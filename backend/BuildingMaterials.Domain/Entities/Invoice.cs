using BuildingMaterials.Domain.Entities.Base;
using BuildingMaterials.Domain.Enums;

namespace BuildingMaterials.Domain.Entities;

public class Invoice : BaseEntity
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public InvoiceType Type { get; set; }
    public int BranchId { get; set; }
    public Branch Branch { get; set; } = null!;
    public int? ClientId { get; set; }
    public Client? Client { get; set; }
    public string? WalkInClientName { get; set; }
    public int? RelatedInvoiceId { get; set; }
    public Invoice? RelatedInvoice { get; set; }

    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; } = 0;
    public decimal TransportCost { get; set; } = 0;
    public decimal TotalAmount { get; set; }

    public PaymentMethod? PaymentMethod { get; set; }
    public string? PaymentReference { get; set; }
    public DateTime? DeferredDueDate { get; set; }

    public bool IsCancelled { get; set; } = false;
    public string? ProjectName { get; set; }
    public string? Notes { get; set; }
    public string? ReturnReason { get; set; }
    public new int CreatedByEmployeeId { get; set; }
    public Employee CreatedBy { get; set; }

    public DeferredInvoice? DeferredInvoice { get; set; }
    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
}
