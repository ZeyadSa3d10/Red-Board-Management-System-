using BuildingMaterials.Domain.Enums;

namespace BuildingMaterials.Application.DTOs.Inventory;

public class TransferFilterDto : PagedFilterDto
{
    public TransferStatus? Status { get; set; }
}
