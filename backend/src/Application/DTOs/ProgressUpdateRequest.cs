namespace Application.DTOs;

public class ProgressUpdateRequest
{
    public Guid CourseId { get; set; }
    public int Progress { get; set; }
    public int TimeSpent { get; set; }
}

public class LessonCompleteRequest
{
    public Guid CourseId { get; set; }
    public int TimeSpent { get; set; }
}

public class ContentProgressUpdateRequest
{
    public int Progress { get; set; }
    public int TimeSpent { get; set; }
    public bool IsCompleted { get; set; } = false;
} 