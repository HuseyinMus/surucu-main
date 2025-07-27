using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            throw new Exception("User already exists with this email.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            Role = Enum.Parse<UserRole>(request.Role, true),
            CreatedAt = DateTime.UtcNow,
            IsActive = true,
            DrivingSchoolId = request.DrivingSchoolId
        };
        var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
        user.PasswordHash = hasher.HashPassword(user, request.Password);
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        var token = GenerateJwtToken(user);
        return new AuthResponse
        {
            Token = token,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            DrivingSchoolId = user.DrivingSchoolId
        };
    }

    public async Task<AuthResponse> LoginWithTcAsync(TcLoginRequest request)
    {
        Console.WriteLine($"TC Login attempt for TC: {request.TcNumber}");
        
        // Önce Students tablosundan TC ile ara
        var student = await _db.Students
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.TCNumber == request.TcNumber);

        if (student != null && student.User != null && student.User.IsActive)
        {
            Console.WriteLine($"Student found: ID={student.Id}, User ID={student.User.Id}, Name={student.User.FullName}");
            
            Console.WriteLine("Generating JWT token for student...");
            var token = GenerateJwtToken(student.User);
            Console.WriteLine("JWT token generated successfully");

            return new AuthResponse
            {
                Token = token,
                UserId = student.User.Id,
                FullName = student.User.FullName,
                Email = student.User.Email,
                Role = student.User.Role.ToString(),
                DrivingSchoolId = student.User.DrivingSchoolId
            };
        }

        // Eğer öğrenci bulunamadıysa, Users tablosundan TC ile ara (eğitmenler için)
        var user = await _db.Users
            .Include(u => u.Instructor)
            .FirstOrDefaultAsync(u => u.TcNumber == request.TcNumber);

        Console.WriteLine($"User found: {user != null}");
        
        if (user == null)
        {
            Console.WriteLine("User not found in database");
            throw new Exception("TC kimlik numarası bulunamadı.");
        }

        Console.WriteLine($"User details: ID={user.Id}, Name={user.FullName}, Role={user.Role}, IsActive={user.IsActive}");

        if (!user.IsActive)
        {
            Console.WriteLine("User is not active");
            throw new Exception("Kullanıcı aktif değil.");
        }

        // Öğrenci ve eğitmenler TC ile giriş yapabilir
        if (user.Role != UserRole.Student && user.Role != UserRole.Instructor)
        {
            Console.WriteLine($"User role {user.Role} is not allowed for TC login");
            throw new Exception("Bu giriş yöntemi sadece öğrenci ve eğitmenler için geçerlidir.");
        }

        Console.WriteLine("Generating JWT token...");
        var instructorToken = GenerateJwtToken(user);
        Console.WriteLine("JWT token generated successfully");

        return new AuthResponse
        {
            Token = instructorToken,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            DrivingSchoolId = user.DrivingSchoolId
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        User? user = null;

        if (request.IsTCLogin)
        {
            // TC numarası ile login
            var student = await _db.Students
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.TCNumber == request.TCNumber);
            
            if (student == null || !student.User.IsActive)
                throw new Exception("TC kimlik numarası bulunamadı.");
                
            user = student.User;
        }
        else if (request.IsEmailLogin)
        {
            // Email/Password ile login
            user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            
            if (user == null || !user.IsActive)
                throw new Exception("Invalid credentials.");
                
            var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
            var result = hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password!);
            
            if (result == Microsoft.AspNetCore.Identity.PasswordVerificationResult.Failed)
                throw new Exception("Invalid credentials.");
        }
        else
        {
            throw new Exception("Email/Password veya TC kimlik numarası gerekli.");
        }

        if (user == null)
            throw new Exception("Kullanıcı bulunamadı.");

        var token = GenerateJwtToken(user);
        return new AuthResponse
        {
            Token = token,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            DrivingSchoolId = user.DrivingSchoolId
        };
    }

    // Helper: Generate JWT
    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("FullName", user.FullName),
            new Claim("DrivingSchoolId", user.DrivingSchoolId.ToString()),
            new Claim("UserId", user.Id.ToString()) // UserId claim'i eklendi
        };
        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpireMinutes"]!)),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
} 