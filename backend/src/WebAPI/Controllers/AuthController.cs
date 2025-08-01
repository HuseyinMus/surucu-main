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

    [HttpPost("login-instructor-tc")]
    public async Task<IActionResult> LoginInstructorWithTc([FromBody] TcLoginRequest request)
    {
        try
        {
            // TC numarası ile eğitmeni bul
            var instructor = await _db.Instructors
                .Include(i => i.User)
                .Include(i => i.DrivingSchool)
                .FirstOrDefaultAsync(i => i.User.TcNumber == request.TcNumber && i.IsActive);

            if (instructor == null)
            {
                return BadRequest("Eğitmen bulunamadı veya aktif değil");
            }

            // JWT token oluştur
            var token = _authService.GenerateJwtToken(instructor.User);

            return Ok(new
            {
                token = token,
                userId = instructor.User.Id,
                fullName = instructor.User.FullName,
                email = instructor.User.Email,
                role = "Instructor",
                drivingSchoolId = instructor.DrivingSchoolId,
                instructorId = instructor.Id,
                specialization = instructor.Specialization,
                experience = instructor.Experience,
                drivingSchool = new
                {
                    id = instructor.DrivingSchool.Id,
                    name = instructor.DrivingSchool.Name,
                    address = instructor.DrivingSchool.Address,
                    phone = instructor.DrivingSchool.Phone,
                    email = instructor.DrivingSchool.Email
                }
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