using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Persistence;
using Domain.Entities;
using System.Security.Cryptography;
using System.Text;
using BCrypt.Net;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeedController : ControllerBase
{
    private readonly AppDbContext _context;

    public SeedController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("test-data")]
    public async Task<ActionResult> SeedTestData()
    {
        try
        {
            // Driving School oluştur
            var drivingSchool = new DrivingSchool
            {
                Id = Guid.NewGuid(),
                Name = "Test Sürücü Kursu",
                Address = "Test Adres, İstanbul",
                Phone = "0212 123 45 67",
                Email = "test@surucukursu.com",
                TaxNumber = "1234567890",
                CreatedAt = DateTime.UtcNow
            };

            _context.DrivingSchools.Add(drivingSchool);

            // Test öğrencileri oluştur
            var students = new List<Student>();
            var studentNames = new[]
            {
                "Ahmet Yılmaz",
                "Ayşe Demir",
                "Mehmet Kaya",
                "Fatma Özkan",
                "Ali Çelik",
                "Zeynep Arslan",
                "Mustafa Şahin",
                "Elif Yıldız",
                "Hasan Koç",
                "Meryem Aydın"
            };

            for (int i = 0; i < studentNames.Length; i++)
            {
                var user = new User
                {
                    Id = Guid.NewGuid(),
                    FullName = studentNames[i],
                    Email = $"ogrenci{i + 1}@test.com",
                    Phone = $"0532 {100 + i} {1000 + i}",
                    TcNumber = $"1234567890{i:D2}",
                    Role = UserRole.Student,
                    DrivingSchoolId = drivingSchool.Id,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    PasswordHash = HashPassword("123456")
                };

                _context.Users.Add(user);

                var student = new Student
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    DrivingSchoolId = drivingSchool.Id,
                    TCNumber = user.TcNumber,
                    BirthDate = DateTime.UtcNow.AddYears(-20 - i),
                    LicenseType = "B",
                    RegistrationDate = DateTime.UtcNow.AddDays(-30 + i * 3),
                    CurrentStage = (StudentStage)(i % 6), // Farklı aşamalarda öğrenciler
                    IsActive = true,
                    TotalFee = 5000 + (i * 500),
                    PaidAmount = 2000 + (i * 300),
                    RemainingDebt = 3000 + (i * 200),
                    PaymentStatus = i % 3 == 0 ? "Completed" : i % 3 == 1 ? "Pending" : "Partial",
                    NextPaymentDate = DateTime.UtcNow.AddDays(15 + i * 5),
                    ExamDate = i > 5 ? DateTime.UtcNow.AddDays(10 + i) : null,
                    ExamStatus = i > 5 ? "Scheduled" : "NotScheduled",
                    TheoryLessonsCompleted = Math.Min(i * 2, 12),
                    PracticeLessonsCompleted = Math.Min(i * 1, 20),
                    TotalTheoryLessons = 12,
                    TotalPracticeLessons = 20,
                    LastActivityDate = DateTime.UtcNow.AddDays(-i),
                    Tags = i % 2 == 0 ? "VIP,Özel Öğrenci" : i % 3 == 0 ? "Hızlı Öğrenci" : null
                };

                students.Add(student);
                _context.Students.Add(student);

                // Ödeme kayıtları ekle
                var payment = new Payment
                {
                    Id = Guid.NewGuid(),
                    StudentId = student.Id,
                    DrivingSchoolId = drivingSchool.Id,
                    Amount = student.PaidAmount,
                    Type = PaymentType.Registration,
                    Method = PaymentMethod.Cash,
                    Status = PaymentStatus.Completed,
                    PaymentDate = student.RegistrationDate.AddDays(5)
                };

                _context.Payments.Add(payment);
            }

            // Eğitmen ekle
            var instructorUser = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Test Eğitmen",
                Email = "egitmen@test.com",
                Phone = "0532 999 88 77",
                TcNumber = "9876543210",
                Role = UserRole.Instructor,
                DrivingSchoolId = drivingSchool.Id,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                PasswordHash = HashPassword("123456")
            };

            _context.Users.Add(instructorUser);

            var instructor = new Instructor
            {
                Id = Guid.NewGuid(),
                UserId = instructorUser.Id,
                DrivingSchoolId = drivingSchool.Id,
                Branch = InstructorBranch.Practice,
                Specialization = "B Sınıfı",
                Experience = 5,
                IsActive = true
            };

            _context.Instructors.Add(instructor);

            // Kurs ekle
            var course = new Course
            {
                Id = Guid.NewGuid(),
                DrivingSchoolId = drivingSchool.Id,
                Title = "B Sınıfı Ehliyet Kursu",
                Description = "Temel sürüş eğitimi",
                CourseType = CourseType.Theory,
                Tags = "Temel,Ehliyet,B Sınıfı"
            };

            _context.Courses.Add(course);

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Test verisi başarıyla eklendi",
                drivingSchoolId = drivingSchool.Id,
                studentCount = students.Count,
                instructorCount = 1,
                courseCount = 1
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Test verisi eklenirken hata oluştu", details = ex.Message });
        }
    }

    [HttpDelete("clear-data")]
    public async Task<ActionResult> ClearTestData()
    {
        try
        {
            _context.Students.RemoveRange(_context.Students);
            _context.Instructors.RemoveRange(_context.Instructors);
            _context.Courses.RemoveRange(_context.Courses);
            _context.Payments.RemoveRange(_context.Payments);
            _context.Users.RemoveRange(_context.Users.Where(u => u.Role != UserRole.Admin));
            _context.DrivingSchools.RemoveRange(_context.DrivingSchools);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Test verisi temizlendi" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Test verisi temizlenirken hata oluştu", details = ex.Message });
        }
    }

    private string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }
} 