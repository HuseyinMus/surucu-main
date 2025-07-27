namespace Application.DTOs;

public class TcLoginRequest
{
    public string TcNumber { get; set; } = null!;
    public string? Password { get; set; }
} 