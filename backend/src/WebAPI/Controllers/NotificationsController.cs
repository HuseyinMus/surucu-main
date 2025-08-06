using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

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
    public async Task<IActionResult> Create([FromBody] NotificationCreateRequest request)
    {
        try
        {
            // Get DrivingSchoolId from JWT token
            var drivingSchoolIdClaim = User.FindFirst("DrivingSchoolId");
            if (drivingSchoolIdClaim == null || !Guid.TryParse(drivingSchoolIdClaim.Value, out var drivingSchoolId))
            {
                return BadRequest("DrivingSchoolId bulunamadı");
            }
            
            var result = await _service.CreateNotificationAsync(request, drivingSchoolId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest($"Bildirim oluşturulurken hata oluştu: {ex.Message}");
        }
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> List([FromQuery] string? status, [FromQuery] string? type, [FromQuery] string? priority)
    {
        try
        {
            var notifications = await _service.GetAllNotificationsAsync(status, type, priority);
            
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
                        type = "Info",
                        priority = "High",
                        recipientType = "Students",
                        status = "Sent",
                        scheduleType = "Immediate",
                        totalRecipients = 45,
                        sentToRecipients = 45,
                        failedRecipients = 0,
                        openedCount = 38,
                        clickedCount = 12,
                        openRate = 84.4,
                        clickRate = 26.7,
                                        createdAt = DateTime.UtcNow.AddDays(-2),
                sentAt = DateTime.UtcNow.AddDays(-2).AddMinutes(5),
                        tags = new List<string> { "sınav", "duyuru" }
                    },
                    new
                    {
                        id = Guid.NewGuid(),
                        title = "Program Güncellemesi",
                        message = "Direksiyon dersi programı güncellenmiştir.",
                        type = "Success",
                        priority = "Normal",
                        recipientType = "Students",
                        status = "Scheduled",
                        scheduleType = "Scheduled",
                        scheduledDate = DateTime.UtcNow.AddDays(1),
                        totalRecipients = 30,
                        sentToRecipients = 0,
                        failedRecipients = 0,
                        openedCount = 0,
                        clickedCount = 0,
                        openRate = 0,
                        clickRate = 0,
                        createdAt = DateTime.UtcNow.AddDays(-1),
                        tags = new List<string> { "program", "güncelleme" }
                    },
                    new
                    {
                        id = Guid.NewGuid(),
                        title = "Bakım Uyarısı",
                        message = "Araç bakımı nedeniyle dersler yarın iptal edilmiştir.",
                        type = "Warning",
                        priority = "Urgent",
                        recipientType = "Students",
                        status = "Sent",
                        scheduleType = "Immediate",
                        totalRecipients = 25,
                        sentToRecipients = 25,
                        failedRecipients = 2,
                        openedCount = 23,
                        clickedCount = 20,
                        openRate = 92.0,
                        clickRate = 80.0,
                                        createdAt = DateTime.UtcNow.AddHours(-6),
                sentAt = DateTime.UtcNow.AddHours(-6).AddMinutes(2),
                        tags = new List<string> { "bakım", "iptal" }
                    },
                    new
                    {
                        id = Guid.NewGuid(),
                        title = "Haftalık Hatırlatma",
                        message = "Bu hafta ders programınızı kontrol etmeyi unutmayın.",
                        type = "Reminder",
                        priority = "Low",
                        recipientType = "All",
                        status = "Scheduled",
                        scheduleType = "Recurring",
                        recurrenceType = "Weekly",
                        recurrenceInterval = 1,
                        recurrenceDays = new List<string> { "Monday" },
                        totalRecipients = 100,
                        sentToRecipients = 0,
                        failedRecipients = 0,
                        openedCount = 0,
                        clickedCount = 0,
                        openRate = 0,
                        clickRate = 0,
                        createdAt = DateTime.UtcNow.AddDays(-7),
                        tags = new List<string> { "hatırlatma", "haftalık" }
                    }
                };
                
                return Ok(testNotifications);
            }
            
            return Ok(notifications);
        }
        catch (Exception ex)
        {
            return BadRequest($"Bildirimler alınırken hata oluştu: {ex.Message}");
        }
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var notification = await _service.GetNotificationByIdAsync(id);
            if (notification == null)
                return NotFound("Bildirim bulunamadı");
            
            return Ok(notification);
        }
        catch (Exception ex)
        {
            return BadRequest($"Bildirim alınırken hata oluştu: {ex.Message}");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> Update(Guid id, [FromBody] NotificationUpdateRequest request)
    {
        try
        {
            request.Id = id;
            var result = await _service.UpdateNotificationAsync(id, request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest($"Bildirim güncellenirken hata oluştu: {ex.Message}");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _service.DeleteNotificationAsync(id);
            return Ok(new { message = "Bildirim başarıyla silindi" });
        }
        catch (Exception ex)
        {
            return BadRequest($"Bildirim silinirken hata oluştu: {ex.Message}");
        }
    }

    [HttpPost("{id}/resend")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> Resend(Guid id, [FromBody] NotificationResendRequest request)
    {
        try
        {
            request.NotificationId = id;
            var result = await _service.ResendNotificationAsync(id, request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest($"Bildirim yeniden gönderilirken hata oluştu: {ex.Message}");
        }
    }

    [HttpPost("{id}/cancel")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        try
        {
            await _service.CancelNotificationAsync(id);
            return Ok(new { message = "Bildirim iptal edildi" });
        }
        catch (Exception ex)
        {
            return BadRequest($"Bildirim iptal edilirken hata oluştu: {ex.Message}");
        }
    }

    [HttpGet("analytics")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetAnalytics([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        try
        {
            var analytics = await _service.GetNotificationAnalyticsAsync(startDate, endDate);
            return Ok(analytics);
        }
        catch (Exception ex)
        {
            return BadRequest($"Analitik veriler alınırken hata oluştu: {ex.Message}");
        }
    }

    [HttpGet("templates")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetTemplates()
    {
        try
        {
            var templates = await _service.GetNotificationTemplatesAsync();
            return Ok(templates);
        }
        catch (Exception ex)
        {
            return BadRequest($"Şablonlar alınırken hata oluştu: {ex.Message}");
        }
    }

    [HttpPost("templates")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> CreateTemplate([FromBody] NotificationTemplateCreateRequest request)
    {
        try
        {
            var result = await _service.CreateNotificationTemplateAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest($"Şablon oluşturulurken hata oluştu: {ex.Message}");
        }
    }

    [HttpGet("rules")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetRules()
    {
        try
        {
            var rules = await _service.GetNotificationRulesAsync();
            return Ok(rules);
        }
        catch (Exception ex)
        {
            return BadRequest($"Kurallar alınırken hata oluştu: {ex.Message}");
        }
    }

    [HttpPost("rules")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> CreateRule([FromBody] NotificationRuleCreateRequest request)
    {
        try
        {
            var result = await _service.CreateNotificationRuleAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest($"Kural oluşturulurken hata oluştu: {ex.Message}");
        }
    }

    // Student endpoints
    [HttpGet("student")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetStudentNotifications()
    {
        try
        {
            var userId = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userIdGuid))
            {
                return BadRequest("Kullanıcı ID bulunamadı");
            }

            var notifications = await _service.GetUserNotificationsAsync(userIdGuid);
            return Ok(notifications);
        }
        catch (Exception ex)
        {
            return BadRequest($"Bildirimler alınırken hata oluştu: {ex.Message}");
        }
    }

    [HttpPatch("{id}/read")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        try
        {
            await _service.MarkNotificationAsReadAsync(id);
            return Ok(new { success = true, message = "Bildirim okundu olarak işaretlendi" });
        }
        catch (Exception ex)
        {
            return BadRequest($"Bildirim işaretlenirken hata oluştu: {ex.Message}");
        }
    }

    [HttpPatch("{id}/click")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> MarkAsClicked(Guid id)
    {
        try
        {
            await _service.MarkNotificationAsClickedAsync(id);
            return Ok(new { success = true, message = "Bildirim tıklandı olarak işaretlendi" });
        }
        catch (Exception ex)
        {
            return BadRequest($"Bildirim işaretlenirken hata oluştu: {ex.Message}");
        }
    }
} 