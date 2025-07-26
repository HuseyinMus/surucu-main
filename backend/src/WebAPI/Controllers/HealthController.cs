using Microsoft.AspNetCore.Mvc;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new 
        { 
            status = "healthy",
            timestamp = DateTime.UtcNow,
            server = Environment.MachineName,
            version = "1.0.0",
            message = "Sürücü Kursu API çalışıyor"
        });
    }

    [HttpGet("db")]
    public async Task<IActionResult> CheckDatabase([FromServices] Infrastructure.Persistence.AppDbContext db)
    {
        try
        {
            // Basit bir database bağlantı testi
            var canConnect = await db.Database.CanConnectAsync();
            
            if (canConnect)
            {
                return Ok(new 
                { 
                    status = "healthy",
                    database = "connected",
                    timestamp = DateTime.UtcNow
                });
            }
            else
            {
                return ServiceUnavailable(new 
                { 
                    status = "unhealthy",
                    database = "disconnected",
                    timestamp = DateTime.UtcNow
                });
            }
        }
        catch (Exception ex)
        {
            return ServiceUnavailable(new 
            { 
                status = "unhealthy",
                database = "error",
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }

    private IActionResult ServiceUnavailable(object value)
    {
        return StatusCode(503, value);
    }
} 