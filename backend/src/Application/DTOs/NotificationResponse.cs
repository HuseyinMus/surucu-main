namespace Application.DTOs;

public class NotificationResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string Type { get; set; } = null!;
    public DateTime SentAt { get; set; }
    public string Status { get; set; } = null!;
} 