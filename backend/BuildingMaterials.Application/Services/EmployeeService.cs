using AutoMapper;
using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Employee;
using BuildingMaterials.Application.Services.Interfaces;
using BuildingMaterials.Domain.Entities;
using BuildingMaterials.Domain.Enums;
using BuildingMaterials.Domain.Exceptions;
using BuildingMaterials.Infrastructure.Data;
using BuildingMaterials.Application.Extensions;
using BuildingMaterials.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterials.Application.Services;

public class EmployeeService : IEmployeeService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public EmployeeService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<PagedResult<OwnerEmployeeDto>> GetFilteredAsync(EmployeeFilterDto filter)
    {
        var query = _context.Employees
            .Include(x => x.Branch)
            .Where(x => !x.IsDeleted)
            .AsQueryable()
            .ApplySearch(filter.Search, e => e.FullName, e => e.Phone)
            .ApplyWhereIf(filter.BranchId.HasValue, e => e.BranchId == filter.BranchId!.Value)
            .ApplyWhereIf(!string.IsNullOrWhiteSpace(filter.Role), e => e.Role.ToString() == filter.Role)
            .ApplyWhereIf(filter.IsActive.HasValue, e => e.IsActive == filter.IsActive!.Value);

        return await query.ToPagedResultAsync<Employee, OwnerEmployeeDto>(filter, _mapper);
    }

    public async Task<IEnumerable<OwnerEmployeeDto>> GetAllAsync()
    {
        var employees = await _context.Employees
            .Include(x => x.Branch)
            .Where(x => !x.IsDeleted)
            .ToListAsync();
        return _mapper.Map<IEnumerable<OwnerEmployeeDto>>(employees);
    }

    public async Task<OwnerEmployeeDto> GetByIdAsync(int id)
    {
        var employee = await _context.Employees.Include(x => x.Branch).FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted)
            ?? throw new NotFoundException("الموظف غير موجود");
        return _mapper.Map<OwnerEmployeeDto>(employee);
    }

    public async Task<EmployeeDto> CreateAsync(CreateEmployeeDto dto)
    {
        var employee = new Employee
        {
            FullName = dto.FullName,
            Phone = dto.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            NationalId = dto.NationalId,
            Role = Enum.TryParse<EmployeeRole>(dto.Role, out var role)
                ? role
                : throw new BusinessException($"دور غير صالح: {dto.Role}"),
            Salary = dto.Salary,
            BranchId = dto.BranchId,
            JoinDate = dto.JoinDate,
            IsActive = true
        };

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        return _mapper.Map<EmployeeDto>(employee);
    }

    public async Task ResetPasswordAsync(int employeeId, ResetPasswordDto dto)
    {
        var employee = await _context.Employees.FindAsync(employeeId)
            ?? throw new NotFoundException("الموظف غير موجود");

        employee.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

        var tokens = await _context.RefreshTokens
            .Where(x => x.EmployeeId == employeeId && !x.IsRevoked)
            .ToListAsync();
        tokens.ForEach(t => t.IsRevoked = true);

        await _context.SaveChangesAsync();
    }

    public async Task<EmployeeDto> ToggleActiveAsync(int employeeId)
    {
        var employee = await _context.Employees.FindAsync(employeeId)
            ?? throw new NotFoundException("الموظف غير موجود");

        employee.IsActive = !employee.IsActive;
        await _context.SaveChangesAsync();

        return _mapper.Map<EmployeeDto>(employee);
    }

    public async Task DeleteAsync(int employeeId)
    {
        var employee = await _context.Employees.FindAsync(employeeId)
            ?? throw new NotFoundException("الموظف غير موجود");

        employee.IsDeleted = true;
        employee.IsActive = false;
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<SalaryPaymentResponseDto>> GetSalaryPaymentsAsync()
    {
        var payments = await _context.SalaryPayments
            .Include(x => x.Employee)
            .Include(x => x.PaidBy)
            .ToListAsync();

        return payments.Select(x => new SalaryPaymentResponseDto
        {
            Id = x.Id,
            EmployeeId = x.EmployeeId,
            EmployeeName = x.Employee.FullName,
            Month = x.Month,
            Year = x.Year,
            Amount = x.Amount,
            PaymentMethod = x.PaymentMethod.ToString(),
            PaidDate = x.PaidDate,
            PaidByEmployeeName = x.PaidBy.FullName,
            Notes = x.Notes,
            Status = "paid"
        });
    }

    public async Task<EmployeeDto> PaySalaryAsync(SalaryPaymentDto dto, int paidByEmployeeId)
    {
        var employee = await _context.Employees.FindAsync(dto.EmployeeId)
            ?? throw new NotFoundException("الموظف غير موجود");

        var exists = await _context.SalaryPayments
            .AnyAsync(x => x.EmployeeId == dto.EmployeeId && x.Month == dto.Month && x.Year == dto.Year);
        if (exists)
            throw new BusinessException("تم دفع راتب هذا الموظف لهذا الشهر بالفعل");

        var payment = new SalaryPayment
        {
            EmployeeId = dto.EmployeeId,
            Month = dto.Month,
            Year = dto.Year,
            Amount = dto.Amount,
            PaymentMethod = Enum.TryParse<PaymentMethod>(dto.PaymentMethod, ignoreCase: true, out var paymentMethod)
                ? paymentMethod
                : throw new BusinessException($"طريقة دفع غير صالحة: {dto.PaymentMethod}"),
            PaidDate = DateTime.UtcNow,
            PaidByEmployeeId = paidByEmployeeId,
            Notes = dto.Notes
        };

        _context.SalaryPayments.Add(payment);
        await _context.SaveChangesAsync();

        return _mapper.Map<EmployeeDto>(employee);
    }

    public async Task AddAdvanceAsync(int employeeId, SalaryAdvanceDto dto, int paidByEmployeeId)
    {
        var employee = await _context.Employees.FindAsync(employeeId)
            ?? throw new NotFoundException("الموظف غير موجود");

        var advance = new SalaryAdvance
        {
            EmployeeId = employeeId,
            Amount = dto.Amount,
            AdvanceDate = dto.AdvanceDate,
            Notes = dto.Notes,
            IsDeducted = false
        };

        _context.SalaryAdvances.Add(advance);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<SalaryAdvanceResponseDto>> GetAdvancesAsync(int employeeId)
    {
        var advances = await _context.SalaryAdvances
            .Include(x => x.Employee)
            .Where(x => x.EmployeeId == employeeId)
            .OrderByDescending(x => x.AdvanceDate)
            .ToListAsync();

        return advances.Select(x => new SalaryAdvanceResponseDto
        {
            Id = x.Id,
            EmployeeId = x.EmployeeId,
            EmployeeName = x.Employee.FullName,
            Amount = x.Amount,
            AdvanceDate = x.AdvanceDate,
            Notes = x.Notes,
            IsDeducted = x.IsDeducted
        });
    }

    public async Task<IEnumerable<SalaryAdvanceResponseDto>> GetAllAdvancesAsync()
    {
        var advances = await _context.SalaryAdvances
            .Include(x => x.Employee)
            .OrderByDescending(x => x.AdvanceDate)
            .ToListAsync();

        return advances.Select(x => new SalaryAdvanceResponseDto
        {
            Id = x.Id,
            EmployeeId = x.EmployeeId,
            EmployeeName = x.Employee.FullName,
            Amount = x.Amount,
            AdvanceDate = x.AdvanceDate,
            Notes = x.Notes,
            IsDeducted = x.IsDeducted
        });
    }

    public async Task<IEnumerable<SalaryPaymentResponseDto>> GetSalaryHistoryAsync(int employeeId)
    {
        var payments = await _context.SalaryPayments
            .Include(x => x.Employee)
            .Include(x => x.PaidBy)
            .Where(x => x.EmployeeId == employeeId)
            .OrderByDescending(x => x.PaidDate)
            .ToListAsync();

        return payments.Select(x => new SalaryPaymentResponseDto
        {
            Id = x.Id,
            EmployeeId = x.EmployeeId,
            EmployeeName = x.Employee.FullName,
            Month = x.Month,
            Year = x.Year,
            Amount = x.Amount,
            PaymentMethod = x.PaymentMethod.ToString(),
            PaidDate = x.PaidDate,
            PaidByEmployeeName = x.PaidBy.FullName,
            Notes = x.Notes,
            Status = "paid"
        });
    }

    public async Task<IEnumerable<EmployeeDto>> GetPendingSalaryAsync(int month, int year)
    {
        var paidEmployeeIds = await _context.SalaryPayments
            .Where(x => x.Month == month && x.Year == year)
            .Select(x => x.EmployeeId)
            .Distinct()
            .ToListAsync();

        var pendingEmployees = await _context.Employees
            .Include(x => x.Branch)
            .Where(x => x.IsActive && !x.IsDeleted && !paidEmployeeIds.Contains(x.Id))
            .ToListAsync();

        return _mapper.Map<IEnumerable<EmployeeDto>>(pendingEmployees);
    }

    public async Task<IEnumerable<EmployeeDto>> GetByBranchAsync(int branchId)
    {
        var employees = await _context.Employees
            .Include(x => x.Branch)
            .Where(x => x.BranchId == branchId && !x.IsDeleted)
            .ToListAsync();
        return _mapper.Map<IEnumerable<EmployeeDto>>(employees);
    }
}
