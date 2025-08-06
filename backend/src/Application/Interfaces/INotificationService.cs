using Application.DTOs;
using Domain.Entities;

namespace Application.Interfaces;

public interface INotificationService
{
    Task<NotificationResponse> SendNotificationAsync(NotificationCreateRequest request);
    Task<NotificationResponse> CreateNotificationAsync(NotificationCreateRequest request, Guid drivingSchoolId);
    Task<List<NotificationResponse>> GetUserNotificationsAsync(Guid userId);
    Task<List<Notification>> GetAllNotificationsAsync();
    Task<List<Notification>> GetAllNotificationsAsync(string? status, string? type, string? priority);
    Task<NotificationResponse> GetNotificationByIdAsync(Guid id);
    Task<NotificationResponse> UpdateNotificationAsync(Guid id, NotificationUpdateRequest request);
    Task DeleteNotificationAsync(Guid id);
    Task<NotificationResponse> ResendNotificationAsync(Guid id, NotificationResendRequest request);
    Task CancelNotificationAsync(Guid id);
    Task<NotificationAnalyticsResponse> GetNotificationAnalyticsAsync(DateTime? startDate, DateTime? endDate);
    Task<List<NotificationTemplateResponse>> GetNotificationTemplatesAsync();
    Task<NotificationTemplateResponse> CreateNotificationTemplateAsync(NotificationTemplateCreateRequest request);
    Task<List<NotificationRuleResponse>> GetNotificationRulesAsync();
    Task<NotificationRuleResponse> CreateNotificationRuleAsync(NotificationRuleCreateRequest request);
    Task MarkNotificationAsReadAsync(Guid id);
    Task MarkNotificationAsClickedAsync(Guid id);
} 