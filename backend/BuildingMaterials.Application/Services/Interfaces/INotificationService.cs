namespace BuildingMaterials.Application.Services.Interfaces;

public interface INotificationService
{
    Task NotifyLowStockAsync(string productName, int branchId, decimal quantity);
    Task NotifyLargeInvoiceAsync(string invoiceNumber, decimal amount, string branchName);
    Task NotifyAllAsync(string message);
}
