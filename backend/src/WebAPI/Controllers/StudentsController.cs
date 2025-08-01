using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Persistence;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StudentsController : ControllerBase
{
    private readonly IStudentService _studentService;
    private readonly AppDbContext _db;
    public StudentsController(IStudentService studentService, AppDbContext db)
    {
        _studentService = studentService;
        _db = db;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> Create([FromBody] Dictionary<string, object> request)
    {
        try
        {
            Console.WriteLine($"Gelen request: {System.Text.Json.JsonSerializer.Serialize(request)}");
            
            var drivingSchoolIdClaim = User.FindFirst("DrivingSchoolId")?.Value;
            if (string.IsNullOrEmpty(drivingSchoolIdClaim))
                return BadRequest("DrivingSchoolId bulunamadı");

            // Frontend'den gelen veriyi parse et (yeni format)
            var fullName = request.ContainsKey("fullName") ? request["fullName"]?.ToString() ?? "" : "";
            var tc = request.ContainsKey("tc") ? request["tc"]?.ToString() ?? "" : "";
            var email = request.ContainsKey("email") ? request["email"]?.ToString() ?? "" : "";
            var phone = request.ContainsKey("phone") ? request["phone"]?.ToString() ?? "" : "";
            var birthDate = request.ContainsKey("birthDate") ? request["birthDate"]?.ToString() ?? "" : "";
            var gender = request.ContainsKey("gender") ? request["gender"]?.ToString() ?? "" : "";
            var licenseType = request.ContainsKey("licenseType") ? request["licenseType"]?.ToString() ?? "" : "";
            var notes = request.ContainsKey("notes") ? request["notes"]?.ToString() ?? "" : "";
            
            Console.WriteLine($"Parsed data - FullName: {fullName}, TC: {tc}, Email: {email}");
            
            // Eğer email zaten varsa, yeni user oluşturma
            var existingUser = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (existingUser != null)
            {
                return BadRequest("Bu e-posta adresi zaten kullanılıyor");
            }

            // Validation
            if (string.IsNullOrEmpty(fullName))
                return BadRequest("Ad ve soyad zorunludur");
            
            if (string.IsNullOrEmpty(tc))
                return BadRequest("TC kimlik numarası zorunludur");
            
            if (string.IsNullOrEmpty(email))
                return BadRequest("E-posta zorunludur");

            // Önce User oluştur
            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = fullName.Trim(),
                Email = email,
                TcNumber = tc, // TC numarasını User tablosuna da ekle
                Role = UserRole.Student,
                CreatedAt = DateTime.UtcNow,
                PasswordHash = "temp", // Geçici şifre hash'i
                DrivingSchoolId = Guid.Parse(drivingSchoolIdClaim)
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            // Sonra Student oluştur
            DateTime parsedBirthDate;
            if (!string.IsNullOrEmpty(birthDate) && DateTime.TryParse(birthDate, out var parsedDate))
            {
                // PostgreSQL için UTC'ye çevir
                parsedBirthDate = DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc);
            }
            else
            {
                parsedBirthDate = DateTime.UtcNow;
            }
            
            var student = new Student
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                DrivingSchoolId = Guid.Parse(drivingSchoolIdClaim),
                TCNumber = tc,
                BirthDate = parsedBirthDate,
                LicenseType = licenseType,
                RegistrationDate = DateTime.UtcNow,
                CurrentStage = StudentStage.Registered,
                PhoneNumber = phone,
                Gender = gender,
                Notes = notes
            };

            _db.Students.Add(student);
            await _db.SaveChangesAsync();

            // Response için user bilgilerini de ekle
            var response = new
            {
                student.Id,
                student.TCNumber,
                student.BirthDate,
                student.LicenseType,
                student.RegistrationDate,
                student.PhoneNumber,
                student.Gender,
                student.Notes,
                fullName = user.FullName,
                email = user.Email
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Öğrenci oluşturma hatası: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            Console.WriteLine($"Inner exception: {ex.InnerException?.Message}");
            return BadRequest($"Öğrenci oluşturulurken hata: {ex.Message}");
        }
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> List()
    {
        try
        {
            var drivingSchoolIdClaim = User.FindFirst("DrivingSchoolId")?.Value;
            if (string.IsNullOrEmpty(drivingSchoolIdClaim))
                return BadRequest("DrivingSchoolId bulunamadı");
                
            var drivingSchoolId = Guid.Parse(drivingSchoolIdClaim);
            var students = await _studentService.GetAllStudentsAsync();
            var filtered = students.Where(s => s.DrivingSchoolId == drivingSchoolId);
            
            // Eğer hiç öğrenci yoksa boş liste döndür
            if (!filtered.Any())
            {
                return Ok(new List<object>());
            }
            
            var result = filtered.Select(s => new {
                s.Id,
                s.LicenseType,
                s.RegistrationDate,
                fullName = s.User != null ? s.User.FullName : null,
                email = s.User != null ? s.User.Email : null,
                tc = s.TCNumber,
                telefon = s.PhoneNumber,
                dogumTarihi = s.BirthDate.ToString("yyyy-MM-dd"),
                cinsiyet = s.Gender,
                notlar = s.Notes
            });
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest($"Öğrenci listesi alınırken hata oluştu: {ex.Message}");
        }
    }

    [HttpGet("findByTc")]
    [AllowAnonymous]
    public async Task<IActionResult> FindByTc([FromQuery] string tc)
    {
        var student = await _studentService.FindByTcAsync(tc);
        if (student == null)
            return NotFound();

        var courses = await _db.Courses
            .Where(c => c.DrivingSchoolId == student.DrivingSchoolId)
            .ToListAsync();
        var quizzes = await _db.Quizzes
            .Where(q => q.DrivingSchoolId == student.DrivingSchoolId)
            .ToListAsync();

        return Ok(new {
            student.Id,
            student.TCNumber,
            student.BirthDate,
            student.LicenseType,
            student.RegistrationDate,
            fullName = student.User?.FullName,
            email = student.User?.Email,
            drivingSchoolId = student.DrivingSchoolId,
            drivingSchoolName = student.DrivingSchool?.Name,
            courses = courses.Select(c => new {
                c.Id,
                c.Title,
                c.Description,
                c.CourseType,
                c.CreatedAt
            }),
            quizzes = quizzes.Select(q => new {
                q.Id,
                q.Title,
                q.TotalPoints,
                q.CreatedAt
            })
        });
    }



    [HttpGet("{id}/contents")]
    [AllowAnonymous]
    public async Task<IActionResult> GetStudentContents([FromRoute] Guid id)
    {
        var student = await _db.Students.FindAsync(id);
        if (student == null)
            return NotFound();
        var courses = await _db.Courses
            .Where(c => c.DrivingSchoolId == student.DrivingSchoolId)
            .Include(c => c.CourseContents)
            .ToListAsync();
        var result = courses.Select(c => new {
            c.Id,
            c.Title,
            c.Description,
            contents = c.CourseContents.Select(cc => new {
                cc.Id,
                cc.Title,
                cc.ContentType,
                cc.ContentUrl,
                cc.Order,
                cc.Duration
            })
        });
        return Ok(result);
    }

    [HttpGet("{id}/progress")]
    [AllowAnonymous]
    public async Task<IActionResult> GetStudentProgress([FromRoute] Guid id)
    {
        var student = await _db.Students.FindAsync(id);
        if (student == null)
            return NotFound();
        var progressService = HttpContext.RequestServices.GetService(typeof(IStudentProgressService)) as IStudentProgressService;
        var report = await progressService.GetProgressReportAsync(id, student.DrivingSchoolId);
        return Ok(report);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Dictionary<string, object> request)
    {
        try
        {
            var student = await _db.Students
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (student == null)
                return NotFound("Öğrenci bulunamadı");

            // Frontend'den gelen veriyi parse et
            var fullName = request.ContainsKey("fullName") ? request["fullName"]?.ToString() ?? "" : "";
            var email = request.ContainsKey("email") ? request["email"]?.ToString() ?? "" : "";
            var telefon = request.ContainsKey("telefon") ? request["telefon"]?.ToString() ?? "" : "";
            var tc = request.ContainsKey("tc") ? request["tc"]?.ToString() ?? "" : "";
            var dogumTarihi = request.ContainsKey("dogumTarihi") ? request["dogumTarihi"]?.ToString() ?? "" : "";
            var cinsiyet = request.ContainsKey("cinsiyet") ? request["cinsiyet"]?.ToString() ?? "" : "";
            var licenseType = request.ContainsKey("licenseType") ? request["licenseType"]?.ToString() ?? "" : "";
            var notlar = request.ContainsKey("notlar") ? request["notlar"]?.ToString() ?? "" : "";

            // Email kontrolü (kendi email'i hariç)
            if (!string.IsNullOrEmpty(email) && email != student.User?.Email)
            {
                var existingUser = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
                if (existingUser != null)
                {
                    return BadRequest("Bu e-posta adresi zaten kullanılıyor");
                }
            }

            // User bilgilerini güncelle
            if (student.User != null)
            {
                student.User.FullName = fullName;
                student.User.Email = email;
            }

            // Student bilgilerini güncelle
            student.TCNumber = tc;
            student.PhoneNumber = telefon;
            student.Gender = cinsiyet;
            student.LicenseType = licenseType;
            student.Notes = notlar;

            // Doğum tarihi güncelle
            if (!string.IsNullOrEmpty(dogumTarihi) && DateTime.TryParse(dogumTarihi, out var parsedDate))
            {
                student.BirthDate = DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc);
            }

            await _db.SaveChangesAsync();

            var response = new
            {
                student.Id,
                student.TCNumber,
                student.BirthDate,
                student.LicenseType,
                student.RegistrationDate,
                student.PhoneNumber,
                student.Gender,
                student.Notes,
                fullName = student.User?.FullName,
                email = student.User?.Email
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest($"Öğrenci güncellenirken hata oluştu: {ex.Message}");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var student = await _db.Students
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (student == null)
                return NotFound("Öğrenci bulunamadı");

            // Öğrenciyi pasif hale getir (soft delete)
            student.IsActive = false;
            student.User.IsActive = false;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Öğrenci başarıyla silindi" });
        }
        catch (Exception ex)
        {
            return BadRequest($"Öğrenci silinirken hata oluştu: {ex.Message}");
        }
    }

    // ÖĞRENCİ RANDEVU YÖNETİMİ ENDPOINT'LERİ

    [HttpGet("available-instructors")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetAvailableInstructors()
    {
        try
        {
            // JWT token'dan student ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // Öğrenciyi bul
            var student = await _db.Students
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound("Öğrenci bulunamadı");
            }

            // Aynı sürücü kursundaki aktif eğitmenleri al
            var instructors = await _db.Instructors
                .Include(i => i.User)
                .Where(i => i.DrivingSchoolId == student.DrivingSchoolId && i.IsActive)
                .Select(i => new
                {
                    id = i.Id,
                    userId = i.UserId,
                    fullName = i.User.FullName,
                    email = i.User.Email,
                    phone = i.User.Phone,
                    specialization = i.Specialization,
                    experience = i.Experience,
                    rating = i.Rating,
                    branch = i.Branch.ToString(),
                    hireDate = i.HireDate,
                    isAvailable = true // TODO: Gerçek müsaitlik kontrolü
                })
                .ToListAsync();

            return Ok(new
            {
                studentId = student.Id,
                drivingSchoolId = student.DrivingSchoolId,
                instructors = instructors,
                totalInstructors = instructors.Count
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Eğitmen listesi alınırken hata oluştu: {ex.Message}");
        }
    }

    [HttpGet("available-slots/{instructorId}")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetAvailableSlots(Guid instructorId, [FromQuery] DateTime date)
    {
        try
        {
            // JWT token'dan student ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // Öğrenciyi bul
            var student = await _db.Students
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound("Öğrenci bulunamadı");
            }

            // Eğitmeni bul
            var instructor = await _db.Instructors
                .FirstOrDefaultAsync(i => i.Id == instructorId && i.DrivingSchoolId == student.DrivingSchoolId);

            if (instructor == null)
            {
                return NotFound("Eğitmen bulunamadı");
            }

            // O gün için mevcut randevuları al
            var existingSchedules = await _db.Schedules
                .Where(s => s.InstructorId == instructorId && 
                           s.ScheduledDate.Date == date.Date &&
                           s.Status != ScheduleStatus.Cancelled)
                .ToListAsync();

            // Müsait saatleri oluştur (09:00-18:00 arası, 1 saatlik slotlar)
            var availableSlots = new List<object>();
            var startHour = 9;
            var endHour = 18;

            for (int hour = startHour; hour < endHour; hour++)
            {
                var slotStart = date.Date.AddHours(hour);
                var slotEnd = slotStart.AddHours(1);

                // Bu slot'ta randevu var mı kontrol et
                var hasConflict = existingSchedules.Any(s => 
                    s.ScheduledDate < slotEnd && 
                    s.ScheduledDate.AddMinutes(s.Duration) > slotStart);

                if (!hasConflict)
                {
                    availableSlots.Add(new
                    {
                        startTime = slotStart,
                        endTime = slotEnd,
                        duration = 60,
                        isAvailable = true
                    });
                }
            }

            return Ok(new
            {
                instructorId = instructorId,
                instructorName = instructor.User.FullName,
                date = date.Date,
                availableSlots = availableSlots,
                totalSlots = availableSlots.Count
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Müsait saatler alınırken hata oluştu: {ex.Message}");
        }
    }

    [HttpPost("book-lesson")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> BookLesson([FromBody] BookLessonRequest request)
    {
        try
        {
            // JWT token'dan student ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // Öğrenciyi bul
            var student = await _db.Students
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound("Öğrenci bulunamadı");
            }

            // Eğitmeni bul
            var instructor = await _db.Instructors
                .FirstOrDefaultAsync(i => i.Id == request.InstructorId && i.DrivingSchoolId == student.DrivingSchoolId);

            if (instructor == null)
            {
                return NotFound("Eğitmen bulunamadı");
            }

            // Randevu çakışması kontrolü
            var conflictingSchedule = await _db.Schedules
                .FirstOrDefaultAsync(s => 
                    s.InstructorId == request.InstructorId &&
                    s.ScheduledDate < request.ScheduledDate.AddMinutes(request.Duration) &&
                    s.ScheduledDate.AddMinutes(s.Duration) > request.ScheduledDate &&
                    s.Status != ScheduleStatus.Cancelled);

            if (conflictingSchedule != null)
            {
                return BadRequest("Seçilen saatte eğitmenin başka bir randevusu bulunmaktadır");
            }

            // Öğrencinin aynı saatte başka randevusu var mı kontrol et
            var studentConflict = await _db.Schedules
                .FirstOrDefaultAsync(s => 
                    s.StudentId == student.Id &&
                    s.ScheduledDate < request.ScheduledDate.AddMinutes(request.Duration) &&
                    s.ScheduledDate.AddMinutes(s.Duration) > request.ScheduledDate &&
                    s.Status != ScheduleStatus.Cancelled);

            if (studentConflict != null)
            {
                return BadRequest("Seçilen saatte başka bir randevunuz bulunmaktadır");
            }

            // Randevu oluştur
            var schedule = new Schedule
            {
                Id = Guid.NewGuid(),
                StudentId = student.Id,
                InstructorId = request.InstructorId,
                DrivingSchoolId = student.DrivingSchoolId,
                LessonType = (Domain.Entities.LessonType)request.LessonType,
                ScheduledDate = request.ScheduledDate,
                Duration = request.Duration,
                Status = ScheduleStatus.Scheduled,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _db.Schedules.Add(schedule);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = schedule.Id,
                studentId = schedule.StudentId,
                instructorId = schedule.InstructorId,
                lessonType = schedule.LessonType.ToString(),
                scheduledDate = schedule.ScheduledDate,
                duration = schedule.Duration,
                status = schedule.Status.ToString(),
                notes = schedule.Notes,
                message = "Randevu başarıyla oluşturuldu"
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Randevu oluşturulurken hata oluştu: {ex.Message}");
        }
    }

    [HttpGet("my-schedules")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMySchedules()
    {
        try
        {
            // JWT token'dan student ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // Öğrenciyi bul
            var student = await _db.Students
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound("Öğrenci bulunamadı");
            }

            // Öğrencinin randevularını al
            var schedules = await _db.Schedules
                .Include(s => s.Instructor)
                .ThenInclude(i => i.User)
                .Where(s => s.StudentId == student.Id)
                .OrderBy(s => s.ScheduledDate)
                .Select(s => new
                {
                    id = s.Id,
                    instructor = new
                    {
                        id = s.Instructor.Id,
                        fullName = s.Instructor.User.FullName,
                        specialization = s.Instructor.Specialization,
                        phone = s.Instructor.User.Phone
                    },
                    lessonType = s.LessonType.ToString(),
                    scheduledDate = s.ScheduledDate,
                    duration = s.Duration,
                    status = s.Status.ToString(),
                    notes = s.Notes,
                    createdAt = s.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                studentId = student.Id,
                schedules = schedules,
                totalSchedules = schedules.Count
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Randevu listesi alınırken hata oluştu: {ex.Message}");
        }
    }

    [HttpPut("schedule/{scheduleId}/cancel")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> CancelSchedule(Guid scheduleId)
    {
        try
        {
            // JWT token'dan student ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // Öğrenciyi bul
            var student = await _db.Students
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (student == null)
            {
                return NotFound("Öğrenci bulunamadı");
            }

            // Randevuyu bul
            var schedule = await _db.Schedules
                .FirstOrDefaultAsync(s => s.Id == scheduleId && s.StudentId == student.Id);

            if (schedule == null)
            {
                return NotFound("Randevu bulunamadı");
            }

            // Randevu iptal edilebilir mi kontrol et (24 saat öncesi)
            if (schedule.ScheduledDate <= DateTime.UtcNow.AddHours(24))
            {
                return BadRequest("Randevu iptali için en az 24 saat önceden haber vermeniz gerekmektedir");
            }

            // Randevuyu iptal et
            schedule.Status = ScheduleStatus.Cancelled;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = schedule.Id,
                status = schedule.Status.ToString(),
                message = "Randevu başarıyla iptal edildi"
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Randevu iptal edilirken hata oluştu: {ex.Message}");
        }
    }
} 