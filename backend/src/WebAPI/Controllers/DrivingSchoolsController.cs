using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Application.DTOs;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DrivingSchoolsController : ControllerBase
{
    private readonly AppDbContext _db;
    public DrivingSchoolsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> List()
    {
        var schools = await _db.DrivingSchools.ToListAsync();
        return Ok(schools);
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] DrivingSchoolCreateRequest request)
    {
        // Sürücü kursu kaydını oluştur
        var school = new DrivingSchool {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Address = request.Address,
            Phone = request.Phone,
            Email = request.Email,
            LogoUrl = request.LogoUrl,
            TaxNumber = request.TaxNumber,
            CreatedAt = DateTime.UtcNow
        };
        _db.DrivingSchools.Add(school);
        // Admin kullanıcı oluştur
        var user = new User {
            Id = Guid.NewGuid(),
            FullName = school.Name + " Admin",
            Email = school.Email,
            Phone = school.Phone,
            Role = UserRole.Admin,
            CreatedAt = DateTime.UtcNow,
            IsActive = true,
            DrivingSchoolId = school.Id
        };
        // Şifre hashlemesi
        var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
        user.PasswordHash = hasher.HashPassword(user, request.Password);
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return Ok(new { school, adminUserEmail = user.Email });
    }

    [HttpGet("me")]
    [Authorize(Roles = "Admin,Instructor")] // veya sadece Admin
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var user = await _db.Users.Include(u => u.DrivingSchool).FirstOrDefaultAsync(u => u.Id.ToString() == userId);
        if (user == null) return Unauthorized();
        var school = await _db.DrivingSchools.FirstOrDefaultAsync(s => s.Id == user.DrivingSchoolId);
        if (school == null) return NotFound();
        return Ok(school);
    }

    // DTO ekle
    public class DrivingSchoolUpdateRequest
    {
        public string Name { get; set; }
        public string Address { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public string TaxNumber { get; set; }
        public string? LogoUrl { get; set; }
    }

    [HttpPut("me")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] DrivingSchoolUpdateRequest request)
    {
        var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id.ToString() == userId);
        if (user == null) return Unauthorized();
        var school = await _db.DrivingSchools.FirstOrDefaultAsync(s => s.Id == user.DrivingSchoolId);
        if (school == null) return NotFound();
        school.Name = request.Name;
        school.Address = request.Address;
        school.Phone = request.Phone;
        school.Email = request.Email;
        school.TaxNumber = request.TaxNumber;
        if (!string.IsNullOrEmpty(request.LogoUrl))
            school.LogoUrl = request.LogoUrl;
        await _db.SaveChangesAsync();
        return Ok(school);
    }

    [HttpPost("upload-logo")]
    [Authorize(Roles = "Admin,Instructor")] // veya sadece Admin
    public async Task<IActionResult> UploadLogo([FromForm] IFormFile logo)
    {
        if (logo == null || logo.Length == 0)
            return BadRequest("Logo dosyası gerekli.");
        var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id.ToString() == userId);
        if (user == null) return Unauthorized();
        var school = await _db.DrivingSchools.FirstOrDefaultAsync(s => s.Id == user.DrivingSchoolId);
        if (school == null) return NotFound();
        var ext = Path.GetExtension(logo.FileName);
        var fileName = $"logo_{school.Id}{ext}";
        var uploadRoot = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        if (!Directory.Exists(uploadRoot)) Directory.CreateDirectory(uploadRoot);
        var filePath = Path.Combine(uploadRoot, fileName);
        using (var stream = new FileStream(filePath, FileMode.Create))
            await logo.CopyToAsync(stream);
        school.LogoUrl = $"/uploads/{fileName}";
        await _db.SaveChangesAsync();
        return Ok(new { logoUrl = school.LogoUrl });
    }
} 