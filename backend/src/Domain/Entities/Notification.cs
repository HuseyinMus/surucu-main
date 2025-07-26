namespace Domain.Entities;

public enum NotificationType
{
    SMS,
    Push
}

public enum NotificationStatus
{
    Sent,
    Failed
}

public class Notification : ITenantEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid DrivingSchoolId { get; set; }
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public NotificationType Type { get; set; }
    public DateTime SentAt { get; set; }
    public NotificationStatus Status { get; set; }
    // Navigation properties
    public User User { get; set; } = null!;
    public DrivingSchool DrivingSchool { get; set; } = null!;
} 