namespace Application.DTOs;

public class NotificationCreateRequest
{
    public Guid UserId { get; set; }
    public Guid DrivingSchoolId { get; set; }
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string Type { get; set; } = null!; // SMS, Push, Info, Success, Warning, Error
    public string RecipientType { get; set; } = "single"; // single, all
    public DateTime? ScheduledDate { get; set; }
} 