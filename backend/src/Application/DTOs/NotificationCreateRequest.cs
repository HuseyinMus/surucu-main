namespace Application.DTOs;

public class NotificationCreateRequest
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string Type { get; set; } = null!; // SMS, Push
} 