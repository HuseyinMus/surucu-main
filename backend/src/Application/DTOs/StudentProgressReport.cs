namespace Application.DTOs;

public class StudentProgressReport
{
    public Guid StudentId { get; set; }
    public Guid CourseId { get; set; }
    public int TotalContents { get; set; }
    public int ViewedContents { get; set; }
    public double CompletionPercent { get; set; }
} 