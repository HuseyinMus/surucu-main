using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
} 