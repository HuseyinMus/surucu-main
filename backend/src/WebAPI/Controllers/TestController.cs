using Microsoft.AspNetCore.Mvc;
using Infrastructure.Persistence;
using Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly AppDbContext _db;

    public TestController(AppDbContext db)
    {
        _db = db;
    }
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { message = "API çalışıyor!", timestamp = DateTime.UtcNow });
    }

    [HttpGet("courses")]
    public async Task<IActionResult> GetCourses()
    {
        // Basit test verisi
        var testCourses = new[]
        {
            new { 
                id = Guid.NewGuid(), 
                title = "Test Kurs 1", 
                description = "Bu bir test kursudur",
                courseType = 0,
                createdAt = DateTime.UtcNow
            },
            new { 
                id = Guid.NewGuid(), 
                title = "Test Kurs 2", 
                description = "Bu da bir test kursudur",
                courseType = 1,
                createdAt = DateTime.UtcNow
            }
        };

        return Ok(testCourses);
    }

    [HttpGet("courses/{id}/contents")]
    public async Task<IActionResult> GetCourseContents(Guid id)
    {
        // Basit test içerikleri
        var testContents = new[]
        {
            new { 
                id = Guid.NewGuid(), 
                title = "Test Ders 1", 
                description = "Bu bir test dersidir",
                contentType = 0,
                contentUrl = "/uploads/test-video.mp4",
                order = 1,
                duration = 300 // 5 dakika
            },
            new { 
                id = Guid.NewGuid(), 
                title = "Test Ders 2", 
                description = "Bu da bir test dersidir",
                contentType = 1,
                contentUrl = "Bu ders metin içerikli",
                order = 2,
                duration = 180 // 3 dakika
            }
        };

        return Ok(testContents);
    }

    [HttpPost("create-student")]
    public async Task<IActionResult> CreateTestStudent()
    {
        try
        {
            // Test sürücü kursu oluştur
            var drivingSchool = new DrivingSchool
            {
                Id = Guid.NewGuid(),
                Name = "Test Sürücü Kursu",
                Address = "Test Adres",
                Phone = "555-123-4567",
                Email = "test@surucu.com",
                TaxNumber = "1234567890",
                CreatedAt = DateTime.UtcNow
            };
            _db.DrivingSchools.Add(drivingSchool);

            // Test kullanıcı oluştur
            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Ahmet Yılmaz",
                Email = "ahmet@test.com",
                Phone = "555-987-6543",
                Role = UserRole.Student,
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                DrivingSchoolId = drivingSchool.Id
            };

            var hasher = new PasswordHasher<User>();
            user.PasswordHash = hasher.HashPassword(user, "123456");
            _db.Users.Add(user);

            // Test öğrenci oluştur
            var student = new Student
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                DrivingSchoolId = drivingSchool.Id,
                TCNumber = "12345678901", // Bu TC ile giriş yapabilir
                BirthDate = new DateTime(1990, 1, 1),
                LicenseType = "B",
                RegistrationDate = DateTime.UtcNow,
                Gender = "Erkek",
                CurrentStage = StudentStage.Theory
            };
            _db.Students.Add(student);

            await _db.SaveChangesAsync();

            return Ok(new { 
                message = "Test öğrenci oluşturuldu!",
                tcNumber = student.TCNumber,
                email = user.Email,
                password = "123456",
                drivingSchoolId = drivingSchool.Id,
                studentId = student.Id
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
} 