namespace BuildingMaterials.Application.DTOs.Client;

public class ClientDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public bool IsCompany { get; set; }
    public decimal TotalDeferred { get; set; }
    public decimal CreditLimit { get; set; }
}

public class CreateClientDto
{
    public string Name { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public bool IsCompany { get; set; } = false;
    public decimal CreditLimit { get; set; } = 0;
}

public class UpdateClientDto
{
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public bool? IsCompany { get; set; }
    public decimal? CreditLimit { get; set; }
}

public class ClientStatementDto
{
    public int ClientId { get; set; }
    public string ClientName { get; set; } = null!;
    public List<ClientStatementItem> Items { get; set; } = null!;
}
public class ClientStatementItem
{
    public DateTime Date { get; set; }
    public string Description { get; set; } = null!;
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
    public decimal Balance { get; set; }
}

public class ClientPaymentResponseDto
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = null!;
    public DateTime PaymentDate { get; set; }
    public string? Notes { get; set; }
}

public class ClientPaymentDto
{
    public int DeferredInvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = null!;
    public DateTime PaymentDate { get; set; }
    public string? CheckNumber { get; set; }
    public string? Notes { get; set; }
}
