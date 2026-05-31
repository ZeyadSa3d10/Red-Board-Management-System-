namespace BuildingMaterials.Application.DTOs.Client;

public class ClientFilterDto : PagedFilterDto
{
    public bool? HasDeferredOnly { get; set; }
}
