namespace Application.DTOs;

public class CourseCreateRequest
{
    public Guid DrivingSchoolId { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string CourseType { get; set; } = null!; // Theory, Practice
    public string? VideoUrl { get; set; }
    public string? ImageUrl { get; set; }
    public string? PdfUrl { get; set; }
    public string? Category { get; set; }
    public string? Tags { get; set; }
} 