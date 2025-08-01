using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Persistence;
using Domain.Entities;
using Application.DTOs;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CRMDashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public CRMDashboardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("overview")]
    public async Task<ActionResult<CRMDashboardResponse>> GetDashboardOverview()
    {
        try
        {
            var drivingSchoolId = GetCurrentDrivingSchoolId();
            
            // Öğrenci istatistikleri
            var totalStudents = await _context.Students
                .Where(s => s.DrivingSchoolId == drivingSchoolId && s.IsActive)
                .CountAsync();

            var newStudentsThisMonth = await _context.Students
                .Where(s => s.DrivingSchoolId == drivingSchoolId && 
                           s.RegistrationDate.Month == DateTime.UtcNow.Month &&
                           s.RegistrationDate.Year == DateTime.UtcNow.Year)
                .CountAsync();

            var studentsInTheory = await _context.Students
                .Where(s => s.DrivingSchoolId == drivingSchoolId && 
                           s.CurrentStage == StudentStage.Theory && s.IsActive)
                .CountAsync();

            var studentsInPractice = await _context.Students
                .Where(s => s.DrivingSchoolId == drivingSchoolId && 
                           s.CurrentStage == StudentStage.Practice && s.IsActive)
                .CountAsync();

            var studentsInExam = await _context.Students
                .Where(s => s.DrivingSchoolId == drivingSchoolId && 
                           s.CurrentStage == StudentStage.Exam && s.IsActive)
                .CountAsync();

            var completedStudents = await _context.Students
                .Where(s => s.DrivingSchoolId == drivingSchoolId && 
                           s.CurrentStage == StudentStage.Completed)
                .CountAsync();

            // Ödeme istatistikleri
            var totalRevenue = await _context.Payments
                .Where(p => p.Student.DrivingSchoolId == drivingSchoolId && 
                           p.Status == PaymentStatus.Completed)
                .SumAsync(p => p.Amount);

            var pendingPayments = await _context.Students
                .Where(s => s.DrivingSchoolId == drivingSchoolId && 
                           s.PaymentStatus == "Pending")
                .CountAsync();

            var overduePayments = await _context.Students
                .Where(s => s.DrivingSchoolId == drivingSchoolId && 
                           s.NextPaymentDate < DateTime.UtcNow &&
                           s.PaymentStatus != "Completed")
                .CountAsync();

            // Eğitmen istatistikleri
            var totalInstructors = await _context.Instructors
                .Where(i => i.DrivingSchoolId == drivingSchoolId && i.IsActive)
                .CountAsync();

            // Kurs istatistikleri
            var totalCourses = await _context.Courses
                .Where(c => c.DrivingSchoolId == drivingSchoolId)
                .CountAsync();

            // Son aktiviteler
            var recentActivities = await _context.Students
                .Where(s => s.DrivingSchoolId == drivingSchoolId)
                .OrderByDescending(s => s.LastActivityDate ?? s.RegistrationDate)
                .Take(10)
                .Select(s => new RecentActivity
                {
                    StudentId = s.Id,
                    StudentName = s.User.FullName,
                    Activity = GetActivityText(s.CurrentStage),
                    Date = s.LastActivityDate ?? s.RegistrationDate,
                    Stage = s.CurrentStage.ToString()
                })
                .ToListAsync();

            // Yaklaşan sınavlar
            var upcomingExams = await _context.Students
                .Where(s => s.DrivingSchoolId == drivingSchoolId && 
                           s.ExamDate != null && 
                           s.ExamDate > DateTime.UtcNow)
                .OrderBy(s => s.ExamDate)
                .Take(5)
                .Select(s => new UpcomingExam
                {
                    StudentId = s.Id,
                    StudentName = s.User.FullName,
                    ExamDate = s.ExamDate!.Value,
                    ExamStatus = s.ExamStatus ?? "Planlandı"
                })
                .ToListAsync();

            // Ödeme hatırlatmaları
            var paymentReminders = await _context.Students
                .Where(s => s.DrivingSchoolId == drivingSchoolId && 
                           s.NextPaymentDate != null && 
                           s.NextPaymentDate <= DateTime.UtcNow.AddDays(7) &&
                           s.PaymentStatus != "Completed")
                .OrderBy(s => s.NextPaymentDate)
                .Take(5)
                .Select(s => new PaymentReminder
                {
                    StudentId = s.Id,
                    StudentName = s.User.FullName,
                    DueDate = s.NextPaymentDate!.Value,
                    Amount = s.RemainingDebt,
                    Status = s.PaymentStatus ?? "Bekliyor"
                })
                .ToListAsync();

            return Ok(new CRMDashboardResponse
            {
                Statistics = new DashboardStatistics
                {
                    TotalStudents = totalStudents,
                    NewStudentsThisMonth = newStudentsThisMonth,
                    StudentsInTheory = studentsInTheory,
                    StudentsInPractice = studentsInPractice,
                    StudentsInExam = studentsInExam,
                    CompletedStudents = completedStudents,
                    TotalRevenue = totalRevenue,
                    PendingPayments = pendingPayments,
                    OverduePayments = overduePayments,
                    TotalInstructors = totalInstructors,
                    TotalCourses = totalCourses
                },
                RecentActivities = recentActivities,
                UpcomingExams = upcomingExams,
                PaymentReminders = paymentReminders
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Dashboard verileri alınırken hata oluştu", details = ex.Message });
        }
    }

    [HttpGet("students/pipeline")]
    public async Task<ActionResult<PipelineResponse>> GetStudentPipeline()
    {
        try
        {
            var drivingSchoolId = GetCurrentDrivingSchoolId();

            var pipeline = await _context.Students
                .Where(s => s.DrivingSchoolId == drivingSchoolId && s.IsActive)
                .Include(s => s.User)
                .Include(s => s.Payments)
                .Include(s => s.ExamResults)
                .Select(s => new StudentPipelineItem
                {
                    Id = s.Id,
                    FullName = s.User.FullName,
                    Email = s.User.Email,
                    Phone = s.User.Phone,
                    TCNumber = s.TCNumber,
                    CurrentStage = s.CurrentStage.ToString(),
                    RegistrationDate = s.RegistrationDate,
                    LastActivityDate = s.LastActivityDate ?? s.RegistrationDate,
                    
                    // Ödeme bilgileri
                    TotalFee = s.TotalFee,
                    PaidAmount = s.PaidAmount,
                    RemainingDebt = s.RemainingDebt,
                    PaymentStatus = s.PaymentStatus ?? "Pending",
                    NextPaymentDate = s.NextPaymentDate,
                    
                    // Sınav bilgileri
                    ExamDate = s.ExamDate,
                    ExamStatus = s.ExamStatus ?? "NotScheduled",
                    
                    // İlerleme bilgileri
                    TheoryLessonsCompleted = s.TheoryLessonsCompleted,
                    PracticeLessonsCompleted = s.PracticeLessonsCompleted,
                    TotalTheoryLessons = s.TotalTheoryLessons,
                    TotalPracticeLessons = s.TotalPracticeLessons,
                    
                    // İletişim bilgileri
                    EmergencyContact = s.EmergencyContact,
                    Address = s.Address,
                    PhotoUrl = s.PhotoUrl,
                    Notes = s.Notes,
                    
                    // Etiketler
                    Tags = GetStudentTags(s),
                    
                    // İlişkili veriler
                    Payments = s.Payments.Select(p => new PaymentSummary
                    {
                        Id = p.Id,
                        Amount = p.Amount,
                        Type = p.Type.ToString(),
                        Status = p.Status.ToString(),
                        PaymentDate = p.PaymentDate
                    }).ToList(),
                    
                    ExamResults = s.ExamResults.Select(er => new ExamResultSummary
                    {
                        Id = er.Id,
                        Type = er.Type.ToString(),
                        ExamDate = er.ExamDate,
                        Status = er.Status.ToString(),
                        Score = er.Score
                    }).ToList()
                })
                .OrderBy(s => s.RegistrationDate)
                .ToListAsync();

            return Ok(new PipelineResponse
            {
                Students = pipeline,
                PipelineStages = new[]
                {
                    new PipelineStage { 
                        Name = "Registered", 
                        Count = pipeline.Count(s => s.CurrentStage == "Registered"),
                        Color = "#3B82F6",
                        Icon = "📝"
                    },
                    new PipelineStage { 
                        Name = "Theory", 
                        Count = pipeline.Count(s => s.CurrentStage == "Theory"),
                        Color = "#F59E0B",
                        Icon = "📚"
                    },
                    new PipelineStage { 
                        Name = "Practice", 
                        Count = pipeline.Count(s => s.CurrentStage == "Practice"),
                        Color = "#10B981",
                        Icon = "🚗"
                    },
                    new PipelineStage { 
                        Name = "Exam", 
                        Count = pipeline.Count(s => s.CurrentStage == "Exam"),
                        Color = "#8B5CF6",
                        Icon = "📋"
                    },
                    new PipelineStage { 
                        Name = "Completed", 
                        Count = pipeline.Count(s => s.CurrentStage == "Completed"),
                        Color = "#059669",
                        Icon = "🎓"
                    },
                    new PipelineStage { 
                        Name = "Failed", 
                        Count = pipeline.Count(s => s.CurrentStage == "Failed"),
                        Color = "#DC2626",
                        Icon = "❌"
                    }
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Pipeline verileri alınırken hata oluştu", details = ex.Message });
        }
    }

    [HttpPost("students/{studentId}/update-stage")]
    public async Task<ActionResult> UpdateStudentStage(Guid studentId, [FromBody] UpdateStageRequest request)
    {
        try
        {
            var drivingSchoolId = GetCurrentDrivingSchoolId();
            
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.Id == studentId && s.DrivingSchoolId == drivingSchoolId);

            if (student == null)
            {
                return NotFound("Öğrenci bulunamadı");
            }

            // Aşama güncelleme
            if (Enum.TryParse<StudentStage>(request.NewStage, out var newStage))
            {
                student.CurrentStage = newStage;
                student.LastActivityDate = DateTime.UtcNow;
            }

            // Etiket güncelleme
            if (request.Tags != null)
            {
                student.Tags = string.Join(",", request.Tags);
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Öğrenci aşaması güncellendi" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Güncelleme sırasında hata oluştu", details = ex.Message });
        }
    }

    [HttpPost("students/{studentId}/add-tag")]
    public async Task<ActionResult> AddStudentTag(Guid studentId, [FromBody] AddTagRequest request)
    {
        try
        {
            var drivingSchoolId = GetCurrentDrivingSchoolId();
            
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.Id == studentId && s.DrivingSchoolId == drivingSchoolId);

            if (student == null)
            {
                return NotFound("Öğrenci bulunamadı");
            }

            var currentTags = string.IsNullOrEmpty(student.Tags) ? new List<string>() : student.Tags.Split(',').ToList();
            
            if (!currentTags.Contains(request.Tag))
            {
                currentTags.Add(request.Tag);
                student.Tags = string.Join(",", currentTags);
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Etiket eklendi" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Etiket eklenirken hata oluştu", details = ex.Message });
        }
    }

    private Guid GetCurrentDrivingSchoolId()
    {
        try
        {
            // Authentication olmadığında ilk driving school'u kullan
            var drivingSchool = _context.DrivingSchools.FirstOrDefault();
            if (drivingSchool == null)
            {
                // Eğer hiç driving school yoksa, bir tane oluştur
                var newDrivingSchool = new DrivingSchool
                {
                    Id = Guid.NewGuid(),
                    Name = "Varsayılan Sürücü Kursu",
                    Address = "Varsayılan Adres",
                    Phone = "05000000000",
                    Email = "info@varsayilan.com",
                    TaxNumber = "1234567890",
                    LicenseNumber = "VSK001",
                    CreatedAt = DateTime.UtcNow
                };
                _context.DrivingSchools.Add(newDrivingSchool);
                _context.SaveChanges();
                return newDrivingSchool.Id;
            }
            return drivingSchool.Id;
        }
        catch (Exception ex)
        {
            // Hata durumunda boş GUID döndür
            return Guid.Empty;
        }
    }

    private static string GetActivityText(StudentStage stage)
    {
        return stage switch
        {
            StudentStage.Registered => "Kayıt oldu",
            StudentStage.Theory => "Teorik derslere başladı",
            StudentStage.Practice => "Pratik derslere başladı",
            StudentStage.Exam => "Sınava girdi",
            StudentStage.Completed => "Kursu tamamladı",
            StudentStage.Failed => "Sınavda başarısız oldu",
            _ => "Aktivite güncellendi"
        };
    }

    private static List<StudentTag> GetStudentTags(Student student)
    {
        var tags = new List<StudentTag>();
        
        // Otomatik etiketler
        if (student.RemainingDebt > 0)
        {
            tags.Add(new StudentTag { Name = "Borçlu", Color = "#DC2626", Type = "Auto" });
        }
        
        if (student.NextPaymentDate.HasValue && student.NextPaymentDate.Value <= DateTime.UtcNow.AddDays(7))
        {
            tags.Add(new StudentTag { Name = "Ödeme Yakın", Color = "#F59E0B", Type = "Auto" });
        }
        
        if (student.ExamDate.HasValue && student.ExamDate.Value <= DateTime.UtcNow.AddDays(14))
        {
            tags.Add(new StudentTag { Name = "Sınav Yakın", Color = "#8B5CF6", Type = "Auto" });
        }
        
        var overallProgress = (student.TheoryLessonsCompleted + student.PracticeLessonsCompleted) / (double)(student.TotalTheoryLessons + student.TotalPracticeLessons) * 100;
        if (overallProgress >= 80)
        {
            tags.Add(new StudentTag { Name = "İyi İlerleme", Color = "#10B981", Type = "Auto" });
        }
        
        // Manuel etiketler
        if (!string.IsNullOrEmpty(student.Tags))
        {
            var manualTags = student.Tags.Split(',');
            foreach (var tag in manualTags)
            {
                if (!string.IsNullOrWhiteSpace(tag))
                {
                    tags.Add(new StudentTag { Name = tag.Trim(), Color = "#6B7280", Type = "Manual" });
                }
            }
        }
        
        return tags;
    }
}

// DTO Classes
public class CRMDashboardResponse
{
    public DashboardStatistics Statistics { get; set; } = new();
    public List<RecentActivity> RecentActivities { get; set; } = new();
    public List<UpcomingExam> UpcomingExams { get; set; } = new();
    public List<PaymentReminder> PaymentReminders { get; set; } = new();
}

public class DashboardStatistics
{
    public int TotalStudents { get; set; }
    public int NewStudentsThisMonth { get; set; }
    public int StudentsInTheory { get; set; }
    public int StudentsInPractice { get; set; }
    public int StudentsInExam { get; set; }
    public int CompletedStudents { get; set; }
    public decimal TotalRevenue { get; set; }
    public int PendingPayments { get; set; }
    public int OverduePayments { get; set; }
    public int TotalInstructors { get; set; }
    public int TotalCourses { get; set; }
}

public class RecentActivity
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string Activity { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Stage { get; set; } = string.Empty;
}

public class UpcomingExam
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public DateTime ExamDate { get; set; }
    public string ExamStatus { get; set; } = string.Empty;
}

public class PaymentReminder
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class PipelineResponse
{
    public List<StudentPipelineItem> Students { get; set; } = new();
    public PipelineStage[] PipelineStages { get; set; } = new PipelineStage[0];
}

public class StudentPipelineItem
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string TCNumber { get; set; } = string.Empty;
    public string CurrentStage { get; set; } = string.Empty;
    public DateTime RegistrationDate { get; set; }
    public DateTime LastActivityDate { get; set; }
    
    // Ödeme bilgileri
    public decimal TotalFee { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingDebt { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
    public DateTime? NextPaymentDate { get; set; }
    
    // Sınav bilgileri
    public DateTime? ExamDate { get; set; }
    public string ExamStatus { get; set; } = string.Empty;
    
    // İlerleme bilgileri
    public int TheoryLessonsCompleted { get; set; }
    public int PracticeLessonsCompleted { get; set; }
    public int TotalTheoryLessons { get; set; }
    public int TotalPracticeLessons { get; set; }
    
    // İletişim bilgileri
    public string? EmergencyContact { get; set; }
    public string? Address { get; set; }
    public string? PhotoUrl { get; set; }
    public string? Notes { get; set; }
    
    // Etiketler
    public List<StudentTag> Tags { get; set; } = new();
    
    // İlişkili veriler
    public List<PaymentSummary> Payments { get; set; } = new();
    public List<ExamResultSummary> ExamResults { get; set; } = new();
    
    // Hesaplanmış değerler
    public double TheoryProgress => TotalTheoryLessons > 0 ? (double)TheoryLessonsCompleted / TotalTheoryLessons * 100 : 0;
    public double PracticeProgress => TotalPracticeLessons > 0 ? (double)PracticeLessonsCompleted / TotalPracticeLessons * 100 : 0;
    public double OverallProgress => (TheoryProgress + PracticeProgress) / 2;
}

public class StudentTag
{
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "Auto" veya "Manual"
}

public class PaymentSummary
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
}

public class ExamResultSummary
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public DateTime ExamDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? Score { get; set; }
}

public class PipelineStage
{
    public string Name { get; set; } = string.Empty;
    public int Count { get; set; }
    public string Color { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
}

public class UpdateStageRequest
{
    public string NewStage { get; set; } = string.Empty;
    public List<string>? Tags { get; set; }
}

public class AddTagRequest
{
    public string Tag { get; set; } = string.Empty;
} 