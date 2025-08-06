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
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
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

            // BCrypt doğrulamasını güvenli şekilde yap
            bool passwordValid = false;
            try
            {
                if (!string.IsNullOrEmpty(user.PasswordHash))
                {
                    passwordValid = BCrypt.Net.BCrypt.Verify(request.Password!, user.PasswordHash);
                }
            }
            catch (BCrypt.Net.SaltParseException)
            {
                // Hash bozuksa veya geçersizse, şifreyi yeniden hash'le
                Console.WriteLine($"Invalid hash for user {user.Email}, rehashing password");
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password!);
                await _db.SaveChangesAsync();
                passwordValid = true; // Yeni hash oluşturuldu, giriş başarılı
            }
            catch (Exception ex)
            {
                Console.WriteLine($"BCrypt verification error: {ex.Message}");
                passwordValid = false;
            }

            if (!passwordValid)
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
    public string GenerateJwtToken(User user)
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

    public async Task<string> GeneratePasswordResetTokenAsync(string email)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) throw new Exception("Kullanıcı bulunamadı");

        var token = Guid.NewGuid().ToString(); // Basit bir token
        user.PasswordResetToken = token;
        user.ResetTokenExpires = DateTime.UtcNow.AddHours(1); // 1 saat geçerli

        await _db.SaveChangesAsync();
        return token;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null) throw new Exception("Kullanıcı bulunamadı");

        if (user.PasswordResetToken != request.Token || user.ResetTokenExpires < DateTime.UtcNow)
        {
            throw new Exception("Geçersiz veya süresi dolmuş token");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

        user.PasswordResetToken = null;
        user.ResetTokenExpires = null;

        await _db.SaveChangesAsync();
        return true;
    }

} 