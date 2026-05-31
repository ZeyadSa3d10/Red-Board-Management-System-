using BuildingMaterials.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterials.API.Services;

public class TokenCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TokenCleanupService> _logger;

    public TokenCleanupService(IServiceScopeFactory scopeFactory, ILogger<TokenCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var now = DateTime.UtcNow;
                var expired = await db.RefreshTokens
                    .Where(t => t.ExpiresAt <= now)
                    .ExecuteDeleteAsync(stoppingToken);

                if (expired > 0)
                    _logger.LogInformation("Cleaned up {Count} expired refresh tokens", expired);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error cleaning up expired refresh tokens");
            }

            try
            {
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
