using System.Text.Json;
using BuildingMaterials.Domain.Entities;
using BuildingMaterials.Domain.Entities.Base;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterials.Infrastructure.Data;

public class AppDbContext : DbContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private static readonly JsonSerializerOptions _jsonOpts = new()
    {
        ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles,
        WriteIndented = false,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
    };

    private static readonly HashSet<Type> _auditedEntities = new()
    {
        typeof(Invoice), typeof(Product), typeof(Employee),
        typeof(ClientPayment), typeof(SupplierPayment),
        typeof(Client), typeof(Supplier), typeof(PurchaseInvoice),
        typeof(DeferredInvoice)
    };

    public AppDbContext(DbContextOptions<AppDbContext> options, IHttpContextAccessor httpContextAccessor) : base(options)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public DbSet<Branch> Branches { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<BranchInventory> BranchInventories { get; set; }
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<InvoiceItem> InvoiceItems { get; set; }
    public DbSet<Client> Clients { get; set; }
    public DbSet<DeferredInvoice> DeferredInvoices { get; set; }
    public DbSet<ClientPayment> ClientPayments { get; set; }
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<PurchaseInvoice> PurchaseInvoices { get; set; }
    public DbSet<PurchaseInvoiceItem> PurchaseInvoiceItems { get; set; }
    public DbSet<SupplierPayment> SupplierPayments { get; set; }
    public DbSet<InventoryTransfer> InventoryTransfers { get; set; }
    public DbSet<InventoryTransferItem> InventoryTransferItems { get; set; }
    public DbSet<SalaryPayment> SalaryPayments { get; set; }
    public DbSet<SalaryAdvance> SalaryAdvances { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<BranchExpense> BranchExpenses { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        foreach (var relationship in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
            relationship.DeleteBehavior = DeleteBehavior.Restrict;

        modelBuilder.Entity<Branch>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Employee>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Product>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Invoice>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Client>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<Supplier>().HasQueryFilter(x => !x.IsDeleted);

        modelBuilder.Entity<Category>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<BranchInventory>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<InvoiceItem>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<DeferredInvoice>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<ClientPayment>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<PurchaseInvoice>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<PurchaseInvoiceItem>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<SupplierPayment>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<InventoryTransfer>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<InventoryTransferItem>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<SalaryPayment>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<SalaryAdvance>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<RefreshToken>().HasQueryFilter(x => !x.IsDeleted
            && !x.IsRevoked);
        modelBuilder.Entity<BranchExpense>().HasQueryFilter(x => !x.IsDeleted);

    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var auditEntries = new List<AuditLog>();

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = now;

            if (!_auditedEntities.Contains(entry.Entity.GetType()))
                continue;

            if (entry.State == EntityState.Added || entry.State == EntityState.Modified || entry.State == EntityState.Deleted)
            {
                var entityId = entry.Entity.Id;
                var oldValues = entry.State == EntityState.Modified
                    ? JsonSerializer.Serialize(entry.OriginalValues.Properties.ToDictionary(p => p.Name, p => entry.OriginalValues[p]), _jsonOpts)
                    : null;
                var newValues = entry.State != EntityState.Deleted
                    ? JsonSerializer.Serialize(entry.CurrentValues.Properties.ToDictionary(p => p.Name, p => entry.CurrentValues[p]), _jsonOpts)
                    : null;

                var action = entry.State switch
                {
                    EntityState.Added => "Create",
                    EntityState.Deleted => "Delete",
                    _ => "Update"
                };

                var employeeId = entry.Entity is Invoice inv && inv.CreatedByEmployeeId != 0
                    ? inv.CreatedByEmployeeId
                    : entry.Entity.CreatedByEmployeeId;

                var ipAddress = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

                auditEntries.Add(new AuditLog
                {
                    EmployeeId = employeeId,
                    EntityName = entry.Entity.GetType().Name,
                    EntityId = entityId,
                    Action = action,
                    OldValues = oldValues,
                    NewValues = newValues,
                    Timestamp = now,
                    IpAddress = ipAddress
                });
            }
        }

        var invoicesToCheck = ChangeTracker.Entries<Invoice>()
            .Where(x => x.Entity.IsCancelled && !x.OriginalValues.GetValue<bool>(nameof(Invoice.IsCancelled)))
            .ToList();

        foreach (var entry in invoicesToCheck)
        {
            auditEntries.Add(new AuditLog
            {
                EmployeeId = entry.Entity.CreatedByEmployeeId,
                EntityName = nameof(Invoice),
                EntityId = entry.Entity.Id,
                Action = "Cancel",
                OldValues = JsonSerializer.Serialize(new { entry.Entity.InvoiceNumber, entry.Entity.TotalAmount }, _jsonOpts),
                Timestamp = now
            });
        }

        if (auditEntries.Count > 0)
            AuditLogs.AddRange(auditEntries);

        return await base.SaveChangesAsync(cancellationToken);
    }
}
