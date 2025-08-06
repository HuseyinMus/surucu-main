using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    private readonly ISmsSender _smsSender;
    public NotificationService(AppDbContext db, ISmsSender smsSender)
    {
        _db = db;
        _smsSender = smsSender;
    }

    public async Task<NotificationResponse> SendNotificationAsync(NotificationCreateRequest request)
    {
        // Get DrivingSchoolId from the authenticated user
        var drivingSchoolId = request.DrivingSchoolId;
        
        // If recipientType is "all", we need to handle it differently
        if (request.RecipientType?.ToLower() == "all")
        {
            // For "all" recipients, we'll create a notification for the driving school admin
            // or create multiple notifications for all users in the driving school
            var users = await _db.Users
                .Where(u => u.DrivingSchoolId == drivingSchoolId && u.IsActive)
                .ToListAsync();
            
            var notifications = new List<Notification>();
            foreach (var user in users)
            {
                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    DrivingSchoolId = drivingSchoolId,
                    Title = request.Title,
                    Message = request.Message,
                    Type = Enum.Parse<NotificationType>(request.Type, true),
                    SentAt = DateTime.UtcNow,
                    Status = NotificationStatus.Sent
                };
                
                if (notification.Type == NotificationType.SMS && !string.IsNullOrEmpty(user.Phone))
                {
                    var sent = await _smsSender.SendSmsAsync(user.Phone, request.Message);
                    notification.Status = sent ? NotificationStatus.Sent : NotificationStatus.Failed;
                }
                
                notifications.Add(notification);
            }
            
            _db.Notifications.AddRange(notifications);
            await _db.SaveChangesAsync();
            
            // Return the first notification as response
            return new NotificationResponse
            {
                Id = notifications.First().Id,
                UserId = notifications.First().UserId,
                Title = notifications.First().Title,
                Message = notifications.First().Message,
                Type = notifications.First().Type.ToString(),
                SentAt = notifications.First().SentAt ?? DateTime.UtcNow,
                Status = notifications.First().Status.ToString()
            };
        }
        else
        {
            // Single user notification - but if UserId is dummy, get first user from driving school
            Guid actualUserId = request.UserId;
            if (request.UserId == Guid.Empty)
            {
                var firstUser = await _db.Users
                    .Where(u => u.DrivingSchoolId == drivingSchoolId && u.IsActive)
                    .FirstOrDefaultAsync();
                
                if (firstUser == null)
                {
                    throw new Exception("Bu sürücü kursunda aktif kullanıcı bulunamadı");
                }
                
                actualUserId = firstUser.Id;
            }
            
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = actualUserId,
                DrivingSchoolId = drivingSchoolId,
                Title = request.Title,
                Message = request.Message,
                Type = Enum.Parse<NotificationType>(request.Type, true),
                SentAt = DateTime.UtcNow,
                Status = NotificationStatus.Sent
            };
            
            if (notification.Type == NotificationType.SMS)
            {
                var user = await _db.Users.FindAsync(actualUserId);
                if (user != null && !string.IsNullOrEmpty(user.Phone))
                {
                    var sent = await _smsSender.SendSmsAsync(user.Phone, request.Message);
                    notification.Status = sent ? NotificationStatus.Sent : NotificationStatus.Failed;
                }
                else
                {
                    notification.Status = NotificationStatus.Failed;
                }
            }
            
            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync();
            
            return new NotificationResponse
            {
                Id = notification.Id,
                UserId = notification.UserId,
                Title = notification.Title,
                Message = notification.Message,
                Type = notification.Type.ToString(),
                SentAt = notification.SentAt ?? DateTime.UtcNow,
                Status = notification.Status.ToString()
            };
        }
    }

    public async Task<List<NotificationResponse>> GetUserNotificationsAsync(Guid userId)
    {
        var notifications = await _db.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.SentAt)
            .ToListAsync();
        return notifications.Select(notification => new NotificationResponse
        {
            Id = notification.Id,
            UserId = notification.UserId,
            Title = notification.Title,
            Message = notification.Message,
            Type = notification.Type.ToString(),
            SentAt = notification.SentAt ?? DateTime.UtcNow,
            Status = notification.Status.ToString()
        }).ToList();
    }

    public async Task<List<Notification>> GetAllNotificationsAsync()
    {
        return await _db.Notifications.ToListAsync();
    }

    public async Task<NotificationResponse> UpdateNotificationAsync(Guid id, NotificationUpdateRequest request)
    {
        var notification = await _db.Notifications.FindAsync(id);
        if (notification == null)
            throw new Exception("Bildirim bulunamadı");

        notification.Title = request.Title;
        notification.Message = request.Message;
        notification.Type = Enum.Parse<NotificationType>(request.Type, true);
        notification.SentAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return new NotificationResponse
        {
            Id = notification.Id,
            UserId = notification.UserId,
            Title = notification.Title,
            Message = notification.Message,
            Type = notification.Type.ToString(),
            SentAt = notification.SentAt ?? DateTime.UtcNow,
            Status = notification.Status.ToString()
        };
    }

    public async Task DeleteNotificationAsync(Guid id)
    {
        var notification = await _db.Notifications.FindAsync(id);
        if (notification == null)
            throw new Exception("Bildirim bulunamadı");

        _db.Notifications.Remove(notification);
        await _db.SaveChangesAsync();
    }

    public async Task<NotificationResponse> CreateNotificationAsync(NotificationCreateRequest request, Guid drivingSchoolId)
    {
        request.DrivingSchoolId = drivingSchoolId;
        return await SendNotificationAsync(request);
    }

    public async Task<List<Notification>> GetAllNotificationsAsync(string? status, string? type, string? priority)
    {
        var query = _db.Notifications.AsQueryable();
        
        if (!string.IsNullOrEmpty(status))
            query = query.Where(n => n.Status.ToString() == status);
        
        if (!string.IsNullOrEmpty(type))
            query = query.Where(n => n.Type.ToString() == type);
        
        if (!string.IsNullOrEmpty(priority))
            query = query.Where(n => n.Priority.ToString() == priority);
        
        return await query.ToListAsync();
    }

    public async Task<NotificationResponse> GetNotificationByIdAsync(Guid id)
    {
        var notification = await _db.Notifications.FindAsync(id);
        if (notification == null)
            throw new Exception("Bildirim bulunamadı");

        return new NotificationResponse
        {
            Id = notification.Id,
            UserId = notification.UserId,
            Title = notification.Title,
            Message = notification.Message,
            Type = notification.Type.ToString(),
            SentAt = notification.SentAt ?? DateTime.UtcNow,
            Status = notification.Status.ToString()
        };
    }

    public async Task<NotificationResponse> ResendNotificationAsync(Guid id, NotificationResendRequest request)
    {
        var notification = await _db.Notifications.FindAsync(id);
        if (notification == null)
            throw new Exception("Bildirim bulunamadı");

        // Resend logic would go here
        notification.SentAt = DateTime.UtcNow;
        notification.Status = NotificationStatus.Sent;
        
        await _db.SaveChangesAsync();

        return new NotificationResponse
        {
            Id = notification.Id,
            UserId = notification.UserId,
            Title = notification.Title,
            Message = notification.Message,
            Type = notification.Type.ToString(),
            SentAt = notification.SentAt ?? DateTime.UtcNow,
            Status = notification.Status.ToString()
        };
    }

    public async Task CancelNotificationAsync(Guid id)
    {
        var notification = await _db.Notifications.FindAsync(id);
        if (notification == null)
            throw new Exception("Bildirim bulunamadı");

        notification.Status = NotificationStatus.Cancelled;
        await _db.SaveChangesAsync();
    }

    public async Task<NotificationAnalyticsResponse> GetNotificationAnalyticsAsync(DateTime? startDate, DateTime? endDate)
    {
        var query = _db.Notifications.AsQueryable();
        
        if (startDate.HasValue)
            query = query.Where(n => n.CreatedAt >= startDate.Value);
        
        if (endDate.HasValue)
            query = query.Where(n => n.CreatedAt <= endDate.Value);

        var notifications = await query.ToListAsync();
        
        return new NotificationAnalyticsResponse
        {
            TotalNotifications = notifications.Count,
            SentNotifications = notifications.Count(n => n.Status == NotificationStatus.Sent),
            FailedNotifications = notifications.Count(n => n.Status == NotificationStatus.Failed),
            PendingNotifications = notifications.Count(n => n.Status == NotificationStatus.Pending),
            ScheduledNotifications = notifications.Count(n => n.Status == NotificationStatus.Scheduled),
            AverageOpenRate = notifications.Any() ? notifications.Average(n => n.OpenRate) : 0,
            AverageClickRate = notifications.Any() ? notifications.Average(n => n.ClickRate) : 0,
            TotalRecipients = notifications.Sum(n => n.TotalRecipients),
            TotalOpens = notifications.Sum(n => n.OpenedCount),
            TotalClicks = notifications.Sum(n => n.ClickedCount),
            NotificationsByType = notifications.GroupBy(n => n.Type.ToString())
                .ToDictionary(g => g.Key, g => g.Count()),
            NotificationsByStatus = notifications.GroupBy(n => n.Status.ToString())
                .ToDictionary(g => g.Key, g => g.Count()),
            Trends = new List<NotificationTrendData>()
        };
    }

    public async Task<List<NotificationTemplateResponse>> GetNotificationTemplatesAsync()
    {
        // This would need NotificationTemplate entity to be implemented
        return new List<NotificationTemplateResponse>();
    }

    public async Task<NotificationTemplateResponse> CreateNotificationTemplateAsync(NotificationTemplateCreateRequest request)
    {
        // This would need NotificationTemplate entity to be implemented
        return new NotificationTemplateResponse
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            TitleTemplate = request.TitleTemplate,
            MessageTemplate = request.MessageTemplate,
            Type = request.Type,
            Priority = request.Priority,
            Variables = request.Variables,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    public async Task<List<NotificationRuleResponse>> GetNotificationRulesAsync()
    {
        // This would need NotificationRule entity to be implemented
        return new List<NotificationRuleResponse>();
    }

    public async Task<NotificationRuleResponse> CreateNotificationRuleAsync(NotificationRuleCreateRequest request)
    {
        // This would need NotificationRule entity to be implemented
        return new NotificationRuleResponse
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            TriggerEvent = request.TriggerEvent,
            Condition = request.Condition,
            TemplateId = request.TemplateId,
            RecipientType = request.RecipientType,
            RecipientFilter = request.RecipientFilter,
            IsActive = true,
            Priority = request.Priority,
            CreatedAt = DateTime.UtcNow,
            Template = new NotificationTemplateResponse()
        };
    }

    public async Task MarkNotificationAsReadAsync(Guid id)
    {
        var notification = await _db.Notifications.FindAsync(id);
        if (notification == null)
            throw new Exception("Bildirim bulunamadı");

        notification.OpenedCount++;
        await _db.SaveChangesAsync();
    }

    public async Task MarkNotificationAsClickedAsync(Guid id)
    {
        var notification = await _db.Notifications.FindAsync(id);
        if (notification == null)
            throw new Exception("Bildirim bulunamadı");

        notification.ClickedCount++;
        await _db.SaveChangesAsync();
    }
} 