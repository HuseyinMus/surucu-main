namespace Application.DTOs;

public class NotificationUpdateRequest
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "info";
    public string RecipientType { get; set; } = "all";
    public DateTime? ScheduledDate { get; set; }
} 