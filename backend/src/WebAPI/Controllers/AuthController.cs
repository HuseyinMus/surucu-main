using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Domain.Entities;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly AppDbContext _db;
    
    public AuthController(IAuthService authService, AppDbContext db)
    {
        _authService = authService;
        _db = db;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        return Ok(result);
    }

    [HttpPost("login-tc")]
    public async Task<IActionResult> LoginWithTc([FromBody] TcLoginRequest request)
    {
        try
        {
            var result = await _authService.LoginWithTcAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("create-test-user")]
    public async Task<IActionResult> CreateTestUser()
    {
        try
        {
            // Önce sürücü kursu oluştur
            var drivingSchool = new DrivingSchool
            {
                Id = Guid.NewGuid(),
                Name = "ESEN SÜRÜCÜ KURSU",
                Address = "Merkez Mahallesi, Atatürk Caddesi No:123, İstanbul",
                Phone = "+90 212 555 0123",
                Email = "info@esensurucukursu.com",
                LogoUrl = "https://img.icons8.com/color/96/000000/car.png",
                TaxNumber = "1234567890",
                CreatedAt = DateTime.UtcNow
            };

            _db.DrivingSchools.Add(drivingSchool);

            // Kullanıcı oluştur
            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Ahmet Yılmaz",
                Email = "ahmet@example.com",
                TcNumber = "12345678901",
                Phone = "+90 555 123 4567",
                Role = UserRole.Student,
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                DrivingSchoolId = drivingSchool.Id,
                PasswordHash = "test_hash"
            };

            _db.Users.Add(user);

            // Öğrenci bilgileri oluştur
            var student = new Student
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                DrivingSchoolId = drivingSchool.Id,
                TCNumber = "12345678901",
                BirthDate = new DateTime(1995, 1, 15),
                LicenseType = "B",
                CurrentStage = StudentStage.Theory,
                RegistrationDate = DateTime.UtcNow,
                IsActive = true
            };

            _db.Students.Add(student);

            await _db.SaveChangesAsync();

            return Ok(new { 
                message = "Test kullanıcısı oluşturuldu",
                userId = user.Id,
                drivingSchoolId = drivingSchool.Id,
                tcNumber = "12345678901"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("debug-users")]
    public async Task<IActionResult> DebugUsers()
    {
        try
        {
            var users = await _db.Users
                .Include(u => u.Student)
                .Include(u => u.Instructor)
                .Select(u => new
                {
                    id = u.Id,
                    fullName = u.FullName,
                    email = u.Email,
                    tcNumber = u.TcNumber,
                    role = u.Role.ToString(),
                    isActive = u.IsActive,
                    drivingSchoolId = u.DrivingSchoolId,
                    createdAt = u.CreatedAt,
                    hasStudent = u.Student != null,
                    hasInstructor = u.Instructor != null
                })
                .ToListAsync();

            return Ok(new { 
                message = "Kullanıcılar listelendi",
                count = users.Count,
                users = users
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        try
        {
            // JWT token'dan user ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // User'ı veritabanından bul
            var user = await _db.Users
                .Include(u => u.Student)
                .Include(u => u.Instructor)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound("Kullanıcı bulunamadı");
            }

            // User bilgilerini döndür
            var profile = new
            {
                id = user.Id,
                fullName = user.FullName,
                email = user.Email,
                role = user.Role.ToString(),
                tcNumber = user.Student?.TCNumber,
                phone = user.Phone,
                drivingSchoolId = user.DrivingSchoolId,
                createdAt = user.CreatedAt,
                student = user.Student != null ? new
                {
                    tcNumber = user.Student.TCNumber,
                    birthDate = user.Student.BirthDate,
                    licenseType = user.Student.LicenseType,
                    currentStage = user.Student.CurrentStage
                } : null,
                instructor = user.Instructor != null ? new
                {
                    specialization = user.Instructor.Specialization,
                    experience = user.Instructor.Experience
                } : null
            };

            return Ok(profile);
        }
        catch (Exception ex)
        {
            return BadRequest($"Profil bilgileri alınırken hata oluştu: {ex.Message}");
        }
    }
} 