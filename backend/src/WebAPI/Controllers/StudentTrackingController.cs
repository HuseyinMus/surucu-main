using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Application.DTOs;
using Infrastructure.Persistence;
using Domain.Entities;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StudentTrackingController : ControllerBase
{
    private readonly AppDbContext _db;

    public StudentTrackingController(AppDbContext db)
    {
        _db = db;
    }

    // Öğrenci takip listesi
    [HttpGet]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetStudentTrackingList()
    {
        try
        {
            // JWT token'dan driving school ID'yi al
            var drivingSchoolIdClaim = User.FindFirst("DrivingSchoolId");
            if (drivingSchoolIdClaim == null || !Guid.TryParse(drivingSchoolIdClaim.Value, out var drivingSchoolId))
            {
                return BadRequest("Driving School ID bulunamadı");
            }

            var students = await _db.Students
                .Include(s => s.User)
                .Include(s => s.Payments)
                .Include(s => s.ExamResults)
                .Where(s => s.DrivingSchoolId == drivingSchoolId && s.IsActive)
                .Select(s => new StudentTrackingResponse
                {
                    Id = s.Id,
                    FullName = s.User.FullName,
                    Email = s.User.Email,
                    TCNumber = s.TCNumber,
                    Phone = s.User.Phone,
                    RegistrationDate = s.RegistrationDate,
                    CurrentStage = s.CurrentStage.ToString(),
                    PhotoUrl = s.PhotoUrl,
                    
                    // Ödeme Bilgileri
                    TotalFee = s.TotalFee,
                    PaidAmount = s.PaidAmount,
                    RemainingDebt = s.RemainingDebt,
                    NextPaymentDate = s.NextPaymentDate,
                    PaymentStatus = s.PaymentStatus ?? "Pending",
                    
                    // Sınav Bilgileri
                    ExamDate = s.ExamDate,
                    ExamStatus = s.ExamStatus ?? "NotScheduled",
                    
                    // İletişim Bilgileri
                    EmergencyContact = s.EmergencyContact,
                    Address = s.Address,
                    
                    // Ders Bilgileri
                    TheoryLessonsCompleted = s.TheoryLessonsCompleted,
                    PracticeLessonsCompleted = s.PracticeLessonsCompleted,
                    TotalTheoryLessons = s.TotalTheoryLessons,
                    TotalPracticeLessons = s.TotalPracticeLessons,
                    
                    // Son Aktivite
                    LastActivityDate = s.LastActivityDate,
                    Notes = s.Notes,
                    
                    // İlişkili Veriler
                    Payments = s.Payments.Select(p => new PaymentResponse
                    {
                        Id = p.Id,
                        Amount = p.Amount,
                        Type = p.Type.ToString(),
                        Method = p.Method.ToString(),
                        Status = p.Status.ToString(),
                        PaymentDate = p.PaymentDate,
                        DueDate = p.DueDate,
                        Description = p.Description,
                        ReceiptNumber = p.ReceiptNumber,
                        Notes = p.Notes
                    }).ToList(),
                    
                    ExamResults = s.ExamResults.Select(e => new ExamResultResponse
                    {
                        Id = e.Id,
                        Type = e.Type.ToString(),
                        ExamDate = e.ExamDate,
                        CompletedDate = e.CompletedDate,
                        Score = e.Score,
                        MaxScore = e.MaxScore,
                        Status = e.Status.ToString(),
                        Location = e.Location,
                        Examiner = e.Examiner,
                        Notes = e.Notes,
                        CertificateNumber = e.CertificateNumber,
                        CertificateDate = e.CertificateDate
                    }).ToList()
                })
                .ToListAsync();

            return Ok(students);
        }
        catch (Exception ex)
        {
            return BadRequest($"Öğrenci takip listesi alınırken hata oluştu: {ex.Message}");
        }
    }

    // Öğrenci detayı
    [HttpGet("{studentId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetStudentTrackingDetail(Guid studentId)
    {
        try
        {
            var student = await _db.Students
                .Include(s => s.User)
                .Include(s => s.Payments)
                .Include(s => s.ExamResults)
                .FirstOrDefaultAsync(s => s.Id == studentId);

            if (student == null)
                return NotFound("Öğrenci bulunamadı");

            var response = new StudentTrackingResponse
            {
                Id = student.Id,
                FullName = student.User.FullName,
                Email = student.User.Email,
                TCNumber = student.TCNumber,
                Phone = student.User.Phone,
                RegistrationDate = student.RegistrationDate,
                CurrentStage = student.CurrentStage.ToString(),
                PhotoUrl = student.PhotoUrl,
                
                TotalFee = student.TotalFee,
                PaidAmount = student.PaidAmount,
                RemainingDebt = student.RemainingDebt,
                NextPaymentDate = student.NextPaymentDate,
                PaymentStatus = student.PaymentStatus ?? "Pending",
                
                ExamDate = student.ExamDate,
                ExamStatus = student.ExamStatus ?? "NotScheduled",
                
                EmergencyContact = student.EmergencyContact,
                Address = student.Address,
                
                TheoryLessonsCompleted = student.TheoryLessonsCompleted,
                PracticeLessonsCompleted = student.PracticeLessonsCompleted,
                TotalTheoryLessons = student.TotalTheoryLessons,
                TotalPracticeLessons = student.TotalPracticeLessons,
                
                LastActivityDate = student.LastActivityDate,
                Notes = student.Notes,
                
                Payments = student.Payments.Select(p => new PaymentResponse
                {
                    Id = p.Id,
                    Amount = p.Amount,
                    Type = p.Type.ToString(),
                    Method = p.Method.ToString(),
                    Status = p.Status.ToString(),
                    PaymentDate = p.PaymentDate,
                    DueDate = p.DueDate,
                    Description = p.Description,
                    ReceiptNumber = p.ReceiptNumber,
                    Notes = p.Notes
                }).ToList(),
                
                ExamResults = student.ExamResults.Select(e => new ExamResultResponse
                {
                    Id = e.Id,
                    Type = e.Type.ToString(),
                    ExamDate = e.ExamDate,
                    CompletedDate = e.CompletedDate,
                    Score = e.Score,
                    MaxScore = e.MaxScore,
                    Status = e.Status.ToString(),
                    Location = e.Location,
                    Examiner = e.Examiner,
                    Notes = e.Notes,
                    CertificateNumber = e.CertificateNumber,
                    CertificateDate = e.CertificateDate
                }).ToList()
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest($"Öğrenci detayı alınırken hata oluştu: {ex.Message}");
        }
    }

    // Öğrenci takip bilgilerini güncelle
    [HttpPut("{studentId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> UpdateStudentTracking(Guid studentId, [FromBody] StudentTrackingRequest request)
    {
        try
        {
            var student = await _db.Students.FindAsync(studentId);
            if (student == null)
                return NotFound("Öğrenci bulunamadı");

            // Ödeme bilgilerini güncelle
            student.TotalFee = request.TotalFee;
            student.PaidAmount = request.PaidAmount;
            student.RemainingDebt = request.TotalFee - request.PaidAmount;
            student.NextPaymentDate = request.NextPaymentDate;
            student.PaymentStatus = request.PaymentStatus;

            // Sınav bilgilerini güncelle
            student.ExamDate = request.ExamDate;
            student.ExamStatus = request.ExamStatus;

            // İletişim bilgilerini güncelle
            student.EmergencyContact = request.EmergencyContact;
            student.Address = request.Address;

            // Ders bilgilerini güncelle
            student.TheoryLessonsCompleted = request.TheoryLessonsCompleted;
            student.PracticeLessonsCompleted = request.PracticeLessonsCompleted;
            student.TotalTheoryLessons = request.TotalTheoryLessons;
            student.TotalPracticeLessons = request.TotalPracticeLessons;

            // Notları güncelle
            student.Notes = request.Notes;
            student.LastActivityDate = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Öğrenci takip bilgileri güncellendi" });
        }
        catch (Exception ex)
        {
            return BadRequest($"Öğrenci takip bilgileri güncellenirken hata oluştu: {ex.Message}");
        }
    }

    // Ödeme ekle
    [HttpPost("payment")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> AddPayment([FromBody] PaymentCreateRequest request)
    {
        try
        {
            var student = await _db.Students.FindAsync(request.StudentId);
            if (student == null)
                return NotFound("Öğrenci bulunamadı");

            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                StudentId = request.StudentId,
                DrivingSchoolId = student.DrivingSchoolId,
                Amount = request.Amount,
                Type = Enum.Parse<PaymentType>(request.Type),
                Method = Enum.Parse<PaymentMethod>(request.Method),
                Status = PaymentStatus.Completed,
                PaymentDate = DateTime.UtcNow,
                DueDate = request.DueDate,
                Description = request.Description,
                ReceiptNumber = request.ReceiptNumber,
                Notes = request.Notes
            };

            _db.Payments.Add(payment);

            // Öğrenci ödeme bilgilerini güncelle
            student.PaidAmount += request.Amount;
            student.RemainingDebt = student.TotalFee - student.PaidAmount;
            student.PaymentStatus = student.RemainingDebt <= 0 ? "Completed" : "Partial";
            student.LastActivityDate = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Ödeme başarıyla eklendi", paymentId = payment.Id });
        }
        catch (Exception ex)
        {
            return BadRequest($"Ödeme eklenirken hata oluştu: {ex.Message}");
        }
    }

    // Sınav sonucu ekle
    [HttpPost("exam-result")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> AddExamResult([FromBody] ExamResultCreateRequest request)
    {
        try
        {
            var student = await _db.Students.FindAsync(request.StudentId);
            if (student == null)
                return NotFound("Öğrenci bulunamadı");

            var examResult = new ExamResult
            {
                Id = Guid.NewGuid(),
                StudentId = request.StudentId,
                DrivingSchoolId = student.DrivingSchoolId,
                Type = Enum.Parse<ExamType>(request.Type),
                ExamDate = request.ExamDate,
                Status = ExamResultStatus.Scheduled,
                Location = request.Location,
                Examiner = request.Examiner,
                Notes = request.Notes
            };

            _db.ExamResults.Add(examResult);

            // Öğrenci sınav bilgilerini güncelle
            student.ExamDate = request.ExamDate;
            student.ExamStatus = "Scheduled";
            student.LastActivityDate = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Sınav sonucu başarıyla eklendi", examResultId = examResult.Id });
        }
        catch (Exception ex)
        {
            return BadRequest($"Sınav sonucu eklenirken hata oluştu: {ex.Message}");
        }
    }

    // Sınav sonucunu güncelle
    [HttpPut("exam-result/{examResultId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> UpdateExamResult(Guid examResultId, [FromBody] Dictionary<string, object> request)
    {
        try
        {
            var examResult = await _db.ExamResults.FindAsync(examResultId);
            if (examResult == null)
                return NotFound("Sınav sonucu bulunamadı");

            if (request.ContainsKey("status"))
            {
                examResult.Status = Enum.Parse<ExamResultStatus>(request["status"].ToString()!);
            }

            if (request.ContainsKey("score"))
            {
                examResult.Score = int.Parse(request["score"].ToString()!);
            }

            if (request.ContainsKey("maxScore"))
            {
                examResult.MaxScore = int.Parse(request["maxScore"].ToString()!);
            }

            if (request.ContainsKey("completedDate"))
            {
                examResult.CompletedDate = DateTime.Parse(request["completedDate"].ToString()!);
            }

            if (request.ContainsKey("notes"))
            {
                examResult.Notes = request["notes"].ToString();
            }

            if (request.ContainsKey("certificateNumber"))
            {
                examResult.CertificateNumber = request["certificateNumber"].ToString();
            }

            examResult.UpdatedAt = DateTime.UtcNow;

            // Öğrenci sınav durumunu güncelle
            var student = await _db.Students.FindAsync(examResult.StudentId);
            if (student != null)
            {
                student.ExamStatus = examResult.Status.ToString();
                student.LastActivityDate = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();

            return Ok(new { message = "Sınav sonucu güncellendi" });
        }
        catch (Exception ex)
        {
            return BadRequest($"Sınav sonucu güncellenirken hata oluştu: {ex.Message}");
        }
    }

    // Öğrenci fotoğrafı yükle
    [HttpPost("upload-photo")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> UploadStudentPhoto([FromForm] StudentPhotoUploadRequest request)
    {
        try
        {
            var student = await _db.Students.FindAsync(request.StudentId);
            if (student == null)
                return NotFound("Öğrenci bulunamadı");

            if (request.Photo == null || request.Photo.Length == 0)
                return BadRequest("Fotoğraf seçilmedi");

            // Dosya uzantısını kontrol et
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            var fileExtension = Path.GetExtension(request.Photo.FileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(fileExtension))
                return BadRequest("Sadece JPG, JPEG ve PNG dosyaları kabul edilir");

            // Dosya boyutunu kontrol et (5MB)
            if (request.Photo.Length > 5 * 1024 * 1024)
                return BadRequest("Dosya boyutu 5MB'dan büyük olamaz");

            // Dosya adını oluştur
            var fileName = $"student_{request.StudentId}_{DateTime.UtcNow:yyyyMMddHHmmss}{fileExtension}";
            var uploadPath = Path.Combine("uploads", "students");
            var fullPath = Path.Combine(uploadPath, fileName);

            // Klasörü oluştur
            Directory.CreateDirectory(uploadPath);

            // Dosyayı kaydet
            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await request.Photo.CopyToAsync(stream);
            }

            // Veritabanını güncelle
            student.PhotoUrl = $"/uploads/students/{fileName}";
            student.LastActivityDate = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { 
                message = "Fotoğraf başarıyla yüklendi", 
                photoUrl = student.PhotoUrl 
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Fotoğraf yüklenirken hata oluştu: {ex.Message}");
        }
    }

    // Ödeme raporu
    [HttpGet("payment-report")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetPaymentReport([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var drivingSchoolIdClaim = User.FindFirst("DrivingSchoolId");
            if (drivingSchoolIdClaim == null || !Guid.TryParse(drivingSchoolIdClaim.Value, out var drivingSchoolId))
            {
                return BadRequest("Driving School ID bulunamadı");
            }

            var query = _db.Payments.Where(p => p.DrivingSchoolId == drivingSchoolId);

            if (startDate.HasValue)
                query = query.Where(p => p.PaymentDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(p => p.PaymentDate <= endDate.Value);

            var payments = await query
                .Include(p => p.Student)
                .ThenInclude(s => s.User)
                .ToListAsync();

            var report = new
            {
                TotalPayments = payments.Count,
                TotalAmount = payments.Sum(p => p.Amount),
                CompletedPayments = payments.Count(p => p.Status == PaymentStatus.Completed),
                PendingPayments = payments.Count(p => p.Status == PaymentStatus.Pending),
                PaymentsByType = payments.GroupBy(p => p.Type).Select(g => new
                {
                    Type = g.Key.ToString(),
                    Count = g.Count(),
                    TotalAmount = g.Sum(p => p.Amount)
                }).ToList(),
                PaymentsByMethod = payments.GroupBy(p => p.Method).Select(g => new
                {
                    Method = g.Key.ToString(),
                    Count = g.Count(),
                    TotalAmount = g.Sum(p => p.Amount)
                }).ToList(),
                RecentPayments = payments.OrderByDescending(p => p.PaymentDate).Take(10).Select(p => new
                {
                    StudentName = p.Student.User.FullName,
                    Amount = p.Amount,
                    Type = p.Type.ToString(),
                    Method = p.Method.ToString(),
                    Date = p.PaymentDate
                }).ToList()
            };

            return Ok(report);
        }
        catch (Exception ex)
        {
            return BadRequest($"Ödeme raporu alınırken hata oluştu: {ex.Message}");
        }
    }
} 