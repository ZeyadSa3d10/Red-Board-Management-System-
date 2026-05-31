namespace BuildingMaterials.Application.DTOs.Employee;

public class EmployeeDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public string Role { get; set; } = null!;
    public DateTime JoinDate { get; set; }
    public bool IsActive { get; set; }
    public int? BranchId { get; set; }
    public string? BranchName { get; set; }
}

public class OwnerEmployeeDto : EmployeeDto
{
    public string NationalId { get; set; } = null!;
    public decimal? Salary { get; set; }
}

public class CreateEmployeeDto
{
    public string FullName { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string NationalId { get; set; } = null!;
    public string Role { get; set; } = null!;
    public decimal? Salary { get; set; }
    public int? BranchId { get; set; }
    public DateTime JoinDate { get; set; }
}

public class SalaryAdvanceDto
{
    public decimal Amount { get; set; }
    public DateTime AdvanceDate { get; set; }
    public string? Notes { get; set; }
}
public class SalaryAdvanceResponseDto
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = null!;
    public decimal Amount { get; set; }
    public DateTime AdvanceDate { get; set; }
    public string? Notes { get; set; }
    public bool IsDeducted { get; set; }
}

public class StaffEmployeeDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public string Role { get; set; } = null!;
    public DateTime JoinDate { get; set; }
    public bool IsActive { get; set; }
    public int? BranchId { get; set; }
    public string? BranchName { get; set; }
}

public class SalaryPaymentDto
{
    public int EmployeeId { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = null!;
    public string? Notes { get; set; }
}

public class SalaryPaymentResponseDto
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = null!;
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = null!;
    public DateTime PaidDate { get; set; }
    public string PaidByEmployeeName { get; set; } = null!;
    public string? Notes { get; set; }
    public string Status { get; set; } = "paid";
}
