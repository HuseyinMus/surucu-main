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
                SentAt = notifications.First().SentAt,
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
                SentAt = notification.SentAt,
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
            SentAt = notification.SentAt,
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
            SentAt = notification.SentAt,
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
} 