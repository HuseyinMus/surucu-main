using Application.DTOs;
using Domain.Entities;

namespace Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> LoginWithTcAsync(TcLoginRequest request);
    string GenerateJwtToken(User user);
} 