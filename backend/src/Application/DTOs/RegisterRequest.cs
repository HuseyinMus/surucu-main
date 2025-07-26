namespace Application.DTOs;

public class RegisterRequest
{
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string? Phone { get; set; }
    public Guid DrivingSchoolId { get; set; }
    public string Role { get; set; } = null!; // Admin, Student, Instructor
} 