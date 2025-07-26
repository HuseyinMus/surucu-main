using Application.DTOs;
using Domain.Entities;

namespace Application.Interfaces;

public interface INotificationService
{
    Task<NotificationResponse> SendNotificationAsync(NotificationCreateRequest request);
    Task<List<NotificationResponse>> GetUserNotificationsAsync(Guid userId);
    Task<List<Notification>> GetAllNotificationsAsync();
} 