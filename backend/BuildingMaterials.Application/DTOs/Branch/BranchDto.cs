namespace BuildingMaterials.Application.DTOs.Branch;

public class BranchDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Location { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public bool IsAdminBranch { get; set; }
    public bool IsActive { get; set; }
}

public class CreateBranchDto
{
    public string Name { get; set; } = null!;
    public string Location { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public bool IsAdminBranch { get; set; } = false;
}
