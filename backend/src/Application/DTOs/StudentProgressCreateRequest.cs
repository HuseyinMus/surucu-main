namespace Application.DTOs;

public class StudentProgressCreateRequest
{
    public Guid StudentId { get; set; }
    public Guid CourseContentId { get; set; }
    public int Progress { get; set; } // 0-100
} 