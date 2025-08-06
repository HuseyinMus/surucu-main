using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Persistence;
using Domain.Entities;
using BCrypt.Net;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestDataController : ControllerBase
{
    private readonly AppDbContext _db;

    public TestDataController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost("clear")]
    public async Task<IActionResult> ClearTestData()
    {
        try
        {
            // Tüm test verilerini sil
            _db.StudentProgresses.RemoveRange(_db.StudentProgresses);
            _db.CourseContents.RemoveRange(_db.CourseContents);
            _db.Courses.RemoveRange(_db.Courses);
            _db.Students.RemoveRange(_db.Students);
            _db.Users.RemoveRange(_db.Users);
            _db.DrivingSchools.RemoveRange(_db.DrivingSchools);
            
            await _db.SaveChangesAsync();
            
            return Ok(new { message = "Tüm test verileri temizlendi" });
        }
        catch (Exception ex)
        {
            return BadRequest($"Veri temizleme sırasında hata: {ex.Message}");
        }
    }
    [HttpPost("seed")]
    public async Task<IActionResult> SeedTestData()
    {
        try
        {
            // Önce mevcut verileri temizle
            await ClearTestData();
            
            // Driving School oluştur
            var drivingSchool = new DrivingSchool
            {
                Id = Guid.NewGuid(),
                Name = "Test Sürücü Kursu",
                Address = "Test Adres",
                Phone = "05321234567",
                Email = "test@test.com",
                TaxNumber = "1234567890",
                CreatedAt = DateTime.UtcNow
            };

            _db.DrivingSchools.Add(drivingSchool);
            await _db.SaveChangesAsync();

            // User oluştur
            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Test User",
                Email = "test@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("test123"),
                Role = UserRole.Student,
                DrivingSchoolId = drivingSchool.Id,
                CreatedAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            // Student oluştur
            var student = new Student
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                DrivingSchoolId = drivingSchool.Id,
                TCNumber = "12345678901",
                PhoneNumber = "05321234567",
                Address = "Test Adres",
                BirthDate = DateTime.UtcNow.AddYears(-20),
                Gender = "Erkek",
                LicenseType = "B",
                RegistrationDate = DateTime.UtcNow,
                IsActive = true
            };

            _db.Students.Add(student);
            await _db.SaveChangesAsync();

            // Course oluştur (Mobil uygulamanın aradığı ID)
            var course = new Course
            {
                Id = Guid.Parse("085305ce-ee3a-4294-b763-ca6bb4e3423f"), // Mobil uygulamanın aradığı ID
                Title = "Temel Sürüş Eğitimi",
                Description = "Temel sürüş teknikleri ve trafik kuralları",
                Category = "Temel Eğitim",
                CourseType = CourseType.Theory,
                DrivingSchoolId = drivingSchool.Id,
                ImageUrl = "/uploads/course_image.jpg",
                VideoUrl = "/uploads/course_video.mp4",
                PdfUrl = "/uploads/course_pdf.pdf",
                Tags = "temel,sürüş,eğitim",
                CreatedAt = DateTime.UtcNow
            };

            _db.Courses.Add(course);
            await _db.SaveChangesAsync();

            // Course Content oluştur
            var courseContent = new CourseContent
            {
                Id = Guid.NewGuid(),
                CourseId = course.Id,
                Title = "Örnek Ders",
                Description = "Bu bir örnek ders içeriğidir",
                ContentType = ContentType.PDF,
                ContentUrl = "/uploads/pdf_09ccf33e-3afb-4b79-8633-c3f33ee2973c.pdf",
                Duration = TimeSpan.FromMinutes(30),
                Order = 1
            };

            _db.CourseContents.Add(courseContent);
            await _db.SaveChangesAsync();

            // Student Progress oluştur
            var studentProgress = new StudentProgress
            {
                Id = Guid.NewGuid(),
                StudentId = student.Id,
                CourseId = course.Id,
                ContentId = courseContent.Id,
                Progress = 0,
                TimeSpent = 0,
                IsCompleted = false,
                LastAccessed = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _db.StudentProgresses.Add(studentProgress);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Test verisi başarıyla eklendi",
                drivingSchoolId = drivingSchool.Id,
                userId = user.Id,
                studentId = student.Id,
                courseId = course.Id,
                contentId = courseContent.Id,
                progressId = studentProgress.Id
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Test verisi eklenirken hata: {ex.Message}");
        }
    }

    [HttpGet("check")]
    public async Task<IActionResult> CheckTestData()
    {
        try
        {
            var drivingSchools = await _db.DrivingSchools.CountAsync();
            var users = await _db.Users.CountAsync();
            var students = await _db.Students.CountAsync();
            var courses = await _db.Courses.CountAsync();
            var contents = await _db.CourseContents.CountAsync();
            var progress = await _db.StudentProgresses.CountAsync();

            return Ok(new
            {
                drivingSchools,
                users,
                students,
                courses,
                contents,
                progress
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Veri kontrolü sırasında hata: {ex.Message}");
        }
    }
} 