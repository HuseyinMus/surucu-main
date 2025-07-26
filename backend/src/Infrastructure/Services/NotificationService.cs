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
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Title = request.Title,
            Message = request.Message,
            Type = Enum.Parse<NotificationType>(request.Type, true),
            SentAt = DateTime.UtcNow,
            Status = NotificationStatus.Sent
        };
        if (notification.Type == NotificationType.SMS)
        {
            // Simulate SMS send
            var user = await _db.Users.FindAsync(request.UserId);
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
} 