using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Application.DTOs;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InstructorsController : ControllerBase
{
    private readonly AppDbContext _db;
    public InstructorsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> List()
    {
        var instructors = await _db.Instructors
            .Include(i => i.User)
            .Select(i => new
            {
                id = i.Id,
                user = new
                {
                    fullName = i.User.FullName,
                    email = i.User.Email,
                    phone = i.User.Phone
                },
                specialization = i.Specialization,
                experience = i.Experience,
                rating = i.Rating,
                hireDate = i.HireDate,
                isActive = i.IsActive
            })
            .ToListAsync();

        // Test verileri ekle (eğer hiç instructor yoksa)
        if (!instructors.Any())
        {
            var testInstructors = new List<object>
            {
                new
                {
                    id = Guid.NewGuid(),
                    user = new
                    {
                        fullName = "Ahmet Yılmaz",
                        email = "ahmet.yilmaz@kurs.com",
                        phone = "0532 123 4567"
                    },
                    specialization = "Trafik Kuralları",
                    experience = 5,
                    rating = 4.5,
                    hireDate = DateTime.Now.AddYears(-2),
                    isActive = true
                },
                new
                {
                    id = Guid.NewGuid(),
                    user = new
                    {
                        fullName = "Fatma Demir",
                        email = "fatma.demir@kurs.com",
                        phone = "0533 987 6543"
                    },
                    specialization = "Direksiyon Eğitimi",
                    experience = 8,
                    rating = 4.8,
                    hireDate = DateTime.Now.AddYears(-3),
                    isActive = true
                },
                new
                {
                    id = Guid.NewGuid(),
                    user = new
                    {
                        fullName = "Mehmet Kaya",
                        email = "mehmet.kaya@kurs.com",
                        phone = "0534 555 1234"
                    },
                    specialization = "Motor ve Araç Tekniği",
                    experience = 3,
                    rating = 4.2,
                    hireDate = DateTime.Now.AddYears(-1),
                    isActive = true
                }
            };
            return Ok(testInstructors);
        }

        return Ok(instructors);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] InstructorCreateRequest request)
    {
        try
        {
            // JWT token'dan DrivingSchoolId'yi al
            var drivingSchoolIdClaim = User.FindFirst("DrivingSchoolId")?.Value;
            if (string.IsNullOrEmpty(drivingSchoolIdClaim) || !Guid.TryParse(drivingSchoolIdClaim, out var drivingSchoolId))
            {
                return BadRequest("Geçersiz sürücü kursu bilgisi");
            }

            // TC kimlik numarası kontrolü
            if (string.IsNullOrEmpty(request.TcNumber) || request.TcNumber.Length != 11)
            {
                return BadRequest("Geçerli bir TC kimlik numarası giriniz");
            }

            // E-posta kontrolü
            if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest("Bu e-posta adresi zaten kullanılıyor");
            }

            // TC kimlik numarası kontrolü
            if (await _db.Users.AnyAsync(u => u.TcNumber == request.TcNumber))
            {
                return BadRequest("Bu TC kimlik numarası zaten kullanılıyor");
            }

            // Yeni kullanıcı oluştur
            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                TcNumber = request.TcNumber,
                Role = UserRole.Instructor,
                DrivingSchoolId = drivingSchoolId,
                CreatedAt = DateTime.UtcNow
            };

            // Eğitmenler için şifre oluşturma (TC numarasının son 4 hanesi)
            var defaultPassword = request.TcNumber.Substring(7, 4);
            var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
            user.PasswordHash = hasher.HashPassword(user, defaultPassword);

            _db.Users.Add(user);

            // Yeni eğitmen oluştur
            var instructor = new Instructor
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                DrivingSchoolId = drivingSchoolId,
                Branch = Enum.Parse<InstructorBranch>(request.Branch),
                Specialization = request.Specialization,
                Experience = request.Experience,
                Rating = 0.0,
                HireDate = DateTime.UtcNow,
                IsActive = true
            };

            _db.Instructors.Add(instructor);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = instructor.Id,
                user = new
                {
                    fullName = user.FullName,
                    email = user.Email,
                    phone = user.Phone,
                    tcNumber = user.TcNumber
                },
                specialization = instructor.Specialization,
                experience = instructor.Experience,
                rating = instructor.Rating,
                hireDate = instructor.HireDate,
                isActive = instructor.IsActive
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Eğitmen eklenirken hata oluştu: {ex.Message}");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] InstructorUpdateRequest request)
    {
        try
        {
            var instructor = await _db.Instructors
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (instructor == null)
                return NotFound("Eğitmen bulunamadı");

            // E-posta kontrolü (kendi e-postası hariç)
            if (await _db.Users.AnyAsync(u => u.Email == request.Email && u.Id != instructor.UserId))
            {
                return BadRequest("Bu e-posta adresi zaten kullanılıyor");
            }

            // Kullanıcı bilgilerini güncelle
            instructor.User.FullName = request.FullName;
            instructor.User.Email = request.Email;
            instructor.User.Phone = request.Phone;

            // Eğitmen bilgilerini güncelle
            instructor.Specialization = request.Specialization;
            instructor.Experience = request.Experience;
            instructor.Branch = Enum.Parse<InstructorBranch>(request.Branch);

            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = instructor.Id,
                user = new
                {
                    fullName = instructor.User.FullName,
                    email = instructor.User.Email,
                    phone = instructor.User.Phone,
                    tcNumber = instructor.User.TcNumber
                },
                specialization = instructor.Specialization,
                experience = instructor.Experience,
                rating = instructor.Rating,
                hireDate = instructor.HireDate,
                isActive = instructor.IsActive,
                branch = instructor.Branch.ToString()
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Eğitmen güncellenirken hata oluştu: {ex.Message}");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var instructor = await _db.Instructors
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (instructor == null)
                return NotFound("Eğitmen bulunamadı");

            // Eğitmeni pasif hale getir (soft delete)
            instructor.IsActive = false;
            instructor.User.IsActive = false;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Eğitmen başarıyla silindi" });
        }
        catch (Exception ex)
        {
            return BadRequest($"Eğitmen silinirken hata oluştu: {ex.Message}");
        }
    }

    // EĞİTMEN ÖĞRENCİ YÖNETİMİ ENDPOINT'LERİ

    [HttpGet("my-students")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> GetMyStudents()
    {
        try
        {
            // JWT token'dan instructor ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // Eğitmeni bul
            var instructor = await _db.Instructors
                .FirstOrDefaultAsync(i => i.UserId == userId);

            if (instructor == null)
            {
                return NotFound("Eğitmen bulunamadı");
            }

            // Eğitmenin öğrencilerini al
            var students = await _db.Students
                .Include(s => s.User)
                .Include(s => s.StudentProgresses)
                .ThenInclude(sp => sp.CourseContent)
                .ThenInclude(cc => cc.Course)
                .Where(s => s.DrivingSchoolId == instructor.DrivingSchoolId)
                .Select(s => new
                {
                    id = s.Id,
                    userId = s.UserId,
                    fullName = s.User.FullName,
                    email = s.User.Email,
                    phone = s.User.Phone,
                    tcNumber = s.TCNumber,
                    birthDate = s.BirthDate,
                    licenseType = s.LicenseType,
                    currentStage = s.CurrentStage.ToString(),
                    registrationDate = s.RegistrationDate,
                    isActive = s.IsActive,
                    progress = new
                    {
                        totalCourses = s.StudentProgresses.Select(sp => sp.CourseContent.CourseId).Distinct().Count(),
                        completedCourses = s.StudentProgresses
                            .GroupBy(sp => sp.CourseContent.CourseId)
                            .Count(g => g.Average(sp => sp.Progress) >= 100),
                        overallProgress = s.StudentProgresses.Any() ? 
                            s.StudentProgresses.GroupBy(sp => sp.CourseContent.CourseId)
                                .Average(g => g.Average(sp => sp.Progress)) : 0.0
                    }
                })
                .ToListAsync();

            return Ok(new
            {
                instructorId = instructor.Id,
                specialization = instructor.Specialization,
                experience = instructor.Experience,
                students = students,
                totalStudents = students.Count
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Öğrenci listesi alınırken hata oluştu: {ex.Message}");
        }
    }

    [HttpGet("student/{studentId}")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> GetStudentDetails(Guid studentId)
    {
        try
        {
            // JWT token'dan instructor ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // Eğitmeni bul
            var instructor = await _db.Instructors
                .FirstOrDefaultAsync(i => i.UserId == userId);

            if (instructor == null)
            {
                return NotFound("Eğitmen bulunamadı");
            }

            // Öğrenciyi bul
            var student = await _db.Students
                .Include(s => s.User)
                .Include(s => s.StudentProgresses)
                .ThenInclude(sp => sp.CourseContent)
                .ThenInclude(cc => cc.Course)
                .FirstOrDefaultAsync(s => s.Id == studentId && s.DrivingSchoolId == instructor.DrivingSchoolId);

            if (student == null)
            {
                return NotFound("Öğrenci bulunamadı");
            }

            // Öğrenci progress verilerini hesapla
            var progressData = student.StudentProgresses
                .GroupBy(sp => sp.CourseContent.CourseId)
                .Select(g => new
                {
                    courseId = g.Key,
                    courseName = g.First().CourseContent.Course.Title,
                    progress = g.Average(sp => sp.Progress),
                    timeSpent = g.Sum(sp => sp.TimeSpent),
                    lastAccessed = g.Max(sp => sp.LastAccessed),
                    isCompleted = g.Average(sp => sp.Progress) >= 100
                })
                .ToList();

            var result = new
            {
                id = student.Id,
                userId = student.UserId,
                fullName = student.User.FullName,
                email = student.User.Email,
                phone = student.User.Phone,
                tcNumber = student.TCNumber,
                birthDate = student.BirthDate,
                licenseType = student.LicenseType,
                currentStage = student.CurrentStage.ToString(),
                registrationDate = student.RegistrationDate,
                isActive = student.IsActive,
                progress = new
                {
                    totalCourses = progressData.Count,
                    completedCourses = progressData.Count(p => p.isCompleted),
                    overallProgress = progressData.Any() ? progressData.Average(p => p.progress) : 0.0,
                    totalTimeSpent = progressData.Sum(p => p.timeSpent),
                    lastActivity = progressData.Any() ? progressData.Max(p => p.lastAccessed) : student.RegistrationDate
                },
                courseProgress = progressData
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest($"Öğrenci detayları alınırken hata oluştu: {ex.Message}");
        }
    }

    [HttpPost("student/{studentId}/schedule")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> ScheduleStudentLesson(Guid studentId, [FromBody] ScheduleLessonRequest request)
    {
        try
        {
            // JWT token'dan instructor ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // Eğitmeni bul
            var instructor = await _db.Instructors
                .FirstOrDefaultAsync(i => i.UserId == userId);

            if (instructor == null)
            {
                return NotFound("Eğitmen bulunamadı");
            }

            // Öğrenciyi bul
            var student = await _db.Students
                .FirstOrDefaultAsync(s => s.Id == studentId && s.DrivingSchoolId == instructor.DrivingSchoolId);

            if (student == null)
            {
                return NotFound("Öğrenci bulunamadı");
            }

            // Randevu oluştur
            var schedule = new Schedule
            {
                Id = Guid.NewGuid(),
                StudentId = studentId,
                InstructorId = instructor.Id,
                DrivingSchoolId = instructor.DrivingSchoolId,
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
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> GetMySchedules()
    {
        try
        {
            // JWT token'dan instructor ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // Eğitmeni bul
            var instructor = await _db.Instructors
                .FirstOrDefaultAsync(i => i.UserId == userId);

            if (instructor == null)
            {
                return NotFound("Eğitmen bulunamadı");
            }

            // Eğitmenin randevularını al
            var schedules = await _db.Schedules
                .Include(s => s.Student)
                .ThenInclude(st => st.User)
                .Where(s => s.InstructorId == instructor.Id)
                .OrderBy(s => s.ScheduledDate)
                .Select(s => new
                {
                    id = s.Id,
                    student = new
                    {
                        id = s.Student.Id,
                        fullName = s.Student.User.FullName,
                        tcNumber = s.Student.TCNumber,
                        phone = s.Student.User.Phone
                    },
                    lessonType = s.LessonType.ToString(),
                    scheduledDate = s.ScheduledDate,
                    duration = s.Duration,
                    status = s.Status.ToString(),
                    notes = s.Notes
                })
                .ToListAsync();

            return Ok(new
            {
                instructorId = instructor.Id,
                schedules = schedules,
                totalSchedules = schedules.Count
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Randevu listesi alınırken hata oluştu: {ex.Message}");
        }
    }

    // Randevu onayla
    [HttpPut("schedule/{scheduleId}/approve")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> ApproveSchedule(Guid scheduleId)
    {
        try
        {
            var schedule = await _db.Schedules
                .Include(s => s.Student)
                .ThenInclude(st => st.User)
                .FirstOrDefaultAsync(s => s.Id == scheduleId);

            if (schedule == null)
            {
                return NotFound("Randevu bulunamadı");
            }

            // JWT token'dan instructor ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // Eğitmeni bul
            var instructor = await _db.Instructors
                .FirstOrDefaultAsync(i => i.UserId == userId);

            if (instructor == null)
            {
                return NotFound("Eğitmen bulunamadı");
            }

            // Randevunun bu eğitmene ait olduğunu kontrol et
            if (schedule.InstructorId != instructor.Id)
            {
                return Forbid("Bu randevuyu onaylama yetkiniz yok");
            }

            schedule.Status = ScheduleStatus.Scheduled;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = schedule.Id,
                status = schedule.Status.ToString(),
                message = "Randevu başarıyla onaylandı"
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Randevu onaylanırken hata oluştu: {ex.Message}");
        }
    }

    // Randevu reddet
    [HttpPut("schedule/{scheduleId}/reject")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> RejectSchedule(Guid scheduleId, [FromBody] RejectScheduleRequest request)
    {
        try
        {
            var schedule = await _db.Schedules
                .Include(s => s.Student)
                .ThenInclude(st => st.User)
                .FirstOrDefaultAsync(s => s.Id == scheduleId);

            if (schedule == null)
            {
                return NotFound("Randevu bulunamadı");
            }

            // JWT token'dan instructor ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // Eğitmeni bul
            var instructor = await _db.Instructors
                .FirstOrDefaultAsync(i => i.UserId == userId);

            if (instructor == null)
            {
                return NotFound("Eğitmen bulunamadı");
            }

            // Randevunun bu eğitmene ait olduğunu kontrol et
            if (schedule.InstructorId != instructor.Id)
            {
                return Forbid("Bu randevuyu reddetme yetkiniz yok");
            }

            schedule.Status = ScheduleStatus.Cancelled;
            schedule.Notes = request.Reason;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = schedule.Id,
                status = schedule.Status.ToString(),
                reason = request.Reason,
                message = "Randevu başarıyla reddedildi"
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Randevu reddedilirken hata oluştu: {ex.Message}");
        }
    }

    // Randevu tamamla
    [HttpPut("schedule/{scheduleId}/complete")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> CompleteSchedule(Guid scheduleId)
    {
        try
        {
            var schedule = await _db.Schedules
                .Include(s => s.Student)
                .ThenInclude(st => st.User)
                .FirstOrDefaultAsync(s => s.Id == scheduleId);

            if (schedule == null)
            {
                return NotFound("Randevu bulunamadı");
            }

            // JWT token'dan instructor ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // Eğitmeni bul
            var instructor = await _db.Instructors
                .FirstOrDefaultAsync(i => i.UserId == userId);

            if (instructor == null)
            {
                return NotFound("Eğitmen bulunamadı");
            }

            // Randevunun bu eğitmene ait olduğunu kontrol et
            if (schedule.InstructorId != instructor.Id)
            {
                return Forbid("Bu randevuyu tamamlama yetkiniz yok");
            }

            schedule.Status = ScheduleStatus.Done;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = schedule.Id,
                status = schedule.Status.ToString(),
                message = "Randevu başarıyla tamamlandı"
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Randevu tamamlanırken hata oluştu: {ex.Message}");
        }
    }

    // Profil güncelleme
    [HttpPut("profile")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> UpdateProfile([FromBody] InstructorProfileUpdateRequest request)
    {
        try
        {
            // JWT token'dan instructor ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // Eğitmeni bul
            var instructor = await _db.Instructors
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.UserId == userId);

            if (instructor == null)
            {
                return NotFound("Eğitmen bulunamadı");
            }

            // User bilgilerini güncelle
            instructor.User.FullName = request.FullName;
            instructor.User.Email = request.Email;
            instructor.User.Phone = request.Phone;

            // Instructor bilgilerini güncelle
            instructor.Specialization = request.Specialization;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = instructor.Id,
                user = new
                {
                    fullName = instructor.User.FullName,
                    email = instructor.User.Email,
                    phone = instructor.User.Phone
                },
                specialization = instructor.Specialization,
                experience = instructor.Experience,
                message = "Profil başarıyla güncellendi"
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Profil güncellenirken hata oluştu: {ex.Message}");
        }
    }

    // Şifre değiştirme
    [HttpPut("change-password")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            // JWT token'dan instructor ID'yi al
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest("User ID bulunamadı");
            }

            // Eğitmeni bul
            var instructor = await _db.Instructors
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.UserId == userId);

            if (instructor == null)
            {
                return NotFound("Eğitmen bulunamadı");
            }

            // Şifre değiştirme işlemi (şimdilik basit)
            // TODO: Gerçek şifre hash'leme ve doğrulama ekle
            instructor.User.PasswordHash = request.NewPassword; // Geçici

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Şifre başarıyla değiştirildi"
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Şifre değiştirilirken hata oluştu: {ex.Message}");
        }
    }
} 