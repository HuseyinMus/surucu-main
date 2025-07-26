namespace Application.DTOs;

public class LoginRequest
{
    public string? Email { get; set; }
    public string? Password { get; set; }
    public string? TCNumber { get; set; }
    
    // Email/Password veya sadece TC ile login yapabilir
    public bool IsEmailLogin => !string.IsNullOrEmpty(Email) && !string.IsNullOrEmpty(Password);
    public bool IsTCLogin => !string.IsNullOrEmpty(TCNumber);
} 