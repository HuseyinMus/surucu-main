namespace Application.DTOs;

public class QuizUpdateRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int TotalPoints { get; set; }
    public int? Duration { get; set; }
    public string Status { get; set; } = "active";
    public Guid? CourseId { get; set; }
} 