using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace BuildingMaterials.API.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (role != null)
            await Groups.AddToGroupAsync(Context.ConnectionId, role);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (role != null)
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, role);
        await base.OnDisconnectedAsync(exception);
    }
}
