namespace BuildingMaterials.Domain.Entities;

public class AuditLog
{
    public int Id { get; set; }
    public int? EmployeeId { get; set; }
    public string? EmployeeName { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }

    public Employee? Employee { get; set; }
}
