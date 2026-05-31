using System.Net;
using System.Text.Json;
using BuildingMaterials.Domain.Exceptions;

namespace BuildingMaterials.API.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (NotFoundException ex)
        {
            context.Response.StatusCode = 404;
            await WriteResponse(context, new { success = false, message = ex.Message });
        }
        catch (BusinessException ex)
        {
            context.Response.StatusCode = 400;
            await WriteResponse(context, new { success = false, message = ex.Message });
        }
        catch (UnauthorizedException ex)
        {
            context.Response.StatusCode = 401;
            await WriteResponse(context, new { success = false, message = ex.Message });
        }
        catch (ValidationException ex)
        {
            context.Response.StatusCode = 422;
            await WriteResponse(context, new { success = false, errors = ex.Errors });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = 500;
            await WriteResponse(context, new { success = false, message = "حدث خطأ داخلي في الخادم" });
        }
    }

    private static async Task WriteResponse(HttpContext context, object response)
    {
        context.Response.ContentType = "application/json";
        var json = JsonSerializer.Serialize(response);
        await context.Response.WriteAsync(json);
    }
}
