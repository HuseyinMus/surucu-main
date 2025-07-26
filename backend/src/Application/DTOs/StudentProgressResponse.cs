namespace Application.DTOs;

public class StudentProgressResponse
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid CourseContentId { get; set; }
    public DateTime ViewedAt { get; set; }
    public int Progress { get; set; }
} 