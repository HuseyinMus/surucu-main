using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _service;
    public NotificationsController(INotificationService service)
    {
        _service = service;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> Send([FromBody] NotificationCreateRequest request)
    {
        var result = await _service.SendNotificationAsync(request);
        return Ok(result);
    }

    [HttpGet("user/{userId}")]
    [Authorize(Roles = "Admin,Instructor,Student")]
    public async Task<IActionResult> GetUserNotifications(Guid userId)
    {
        var result = await _service.GetUserNotificationsAsync(userId);
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> List()
    {
        var notifications = await _service.GetAllNotificationsAsync();
        
        // Test verileri ekle (eğer hiç notification yoksa)
        if (!notifications.Any())
        {
            var testNotifications = new List<object>
            {
                new
                {
                    id = Guid.NewGuid(),
                    title = "Yeni Sınav Duyurusu",
                    message = "Trafik İşaretleri sınavı 15 Mart'ta yapılacaktır.",
                    type = "info",
                    recipientType = "Student",
                    sender = "Sistem",
                    recipientCount = 45,
                    createdAt = DateTime.Now.AddDays(-2),
                    isRead = false
                },
                new
                {
                    id = Guid.NewGuid(),
                    message = "Direksiyon dersi programı güncellenmiştir.",
                    title = "Program Güncellemesi",
                    type = "success",
                    recipientType = "Student",
                    sender = "Eğitmen",
                    recipientCount = 30,
                    createdAt = DateTime.Now.AddDays(-1),
                    isRead = true
                },
                new
                {
                    id = Guid.NewGuid(),
                    title = "Bakım Uyarısı",
                    message = "Araç bakımı nedeniyle dersler yarın iptal edilmiştir.",
                    type = "warning",
                    recipientType = "Student",
                    sender = "Yönetim",
                    recipientCount = 25,
                    createdAt = DateTime.Now.AddHours(-6),
                    isRead = false
                },
                new
                {
                    id = Guid.NewGuid(),
                    title = "Sistem Hatası",
                    message = "Teknik bir sorun yaşanmaktadır. Lütfen bekleyiniz.",
                    type = "error",
                    recipientType = "All",
                    sender = "Sistem",
                    recipientCount = 100,
                    createdAt = DateTime.Now.AddHours(-2),
                    isRead = true
                }
            };
            return Ok(testNotifications);
        }
        
        var last5 = notifications.OrderByDescending(n => n.SentAt).Take(5);
        return Ok(last5);
    }
} 