namespace Application.DTOs;

public class StudentCreateRequest
{
    public Guid UserId { get; set; }
    public Guid DrivingSchoolId { get; set; }
    public string TCNumber { get; set; } = null!;
    public DateTime BirthDate { get; set; }
    public string LicenseType { get; set; } = null!;
} 