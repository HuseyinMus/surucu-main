namespace Application.DTOs;

public class InstructorCreateRequest
{
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public string TcNumber { get; set; } = null!;
    public string? Specialization { get; set; }
    public int Experience { get; set; } = 0;
    public string Branch { get; set; } = "Theory";
} 