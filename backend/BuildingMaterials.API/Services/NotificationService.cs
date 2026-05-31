using BuildingMaterials.API.Hubs;
using BuildingMaterials.Application.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace BuildingMaterials.API.Services;

public class NotificationService : INotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyLowStockAsync(string productName, int branchId, decimal quantity)
    {
        await _hubContext.Clients.Group("Owner").SendAsync("Notification", new
        {
            type = "low_stock",
            title = "تنبيه مخزون",
            message = $"المنتج {productName} أصبح أقل من الحد الأدنى (المتبقي: {quantity})",
            productName,
            branchId,
            quantity
        });
    }

    public async Task NotifyLargeInvoiceAsync(string invoiceNumber, decimal amount, string branchName)
    {
        await _hubContext.Clients.Group("Owner").SendAsync("Notification", new
        {
            type = "large_invoice",
            title = "فاتورة كبيرة",
            message = $"فاتورة جديدة بقيمة {amount:N2} في {branchName} - رقم {invoiceNumber}",
            invoiceNumber,
            amount,
            branchName
        });
    }

    public async Task NotifyAllAsync(string message)
    {
        await _hubContext.Clients.All.SendAsync("Notification", new
        {
            type = "info",
            title = "إشعار",
            message
        });
    }
}
