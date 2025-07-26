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
} 