namespace Domain.Entities;

public class DrivingSchool
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Address { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? LogoUrl { get; set; }
    public string TaxNumber { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    // Navigation properties
    public ICollection<Student> Students { get; set; } = new List<Student>();
    public ICollection<Instructor> Instructors { get; set; } = new List<Instructor>();
    public ICollection<Course> Courses { get; set; } = new List<Course>();
} 