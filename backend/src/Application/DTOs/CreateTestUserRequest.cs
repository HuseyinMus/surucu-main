namespace Application.DTOs;

public class CreateTestUserRequest
{
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string TcNumber { get; set; } = null!;
    public string? Phone { get; set; }
    public DateTime BirthDate { get; set; }
} 