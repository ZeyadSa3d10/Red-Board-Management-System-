namespace BuildingMaterials.Application.DTOs.Employee;

public class EmployeeFilterDto : PagedFilterDto
{
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
}
