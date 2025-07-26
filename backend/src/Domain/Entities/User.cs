namespace Domain.Entities;

public enum UserRole
{
    Admin,
    Instructor,
    Student
}

public class User
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string? Phone { get; set; }
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public Guid DrivingSchoolId { get; set; }
    public DrivingSchool DrivingSchool { get; set; } = null!;
    // Navigation properties
    public Student? Student { get; set; }
    public Instructor? Instructor { get; set; }
} 