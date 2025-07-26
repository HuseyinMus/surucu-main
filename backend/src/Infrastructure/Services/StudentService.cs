using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class StudentService : IStudentService
{
    private readonly AppDbContext _db;
    public StudentService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Student> CreateStudentAsync(StudentCreateRequest request)
    {
        var student = new Student
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            DrivingSchoolId = request.DrivingSchoolId,
            TCNumber = request.TCNumber,
            BirthDate = request.BirthDate,
            LicenseType = request.LicenseType,
            RegistrationDate = DateTime.UtcNow,
            CurrentStage = StudentStage.Registered
        };
        _db.Students.Add(student);
        await _db.SaveChangesAsync();
        return student;
    }

    public async Task<List<Student>> GetAllStudentsAsync()
    {
        return await _db.Students
            .Include(s => s.User)
            .ToListAsync();
    }

    public async Task<Student?> FindByTcAsync(string tc)
    {
        return await _db.Students
            .Include(s => s.User)
            .Include(s => s.DrivingSchool)
            .FirstOrDefaultAsync(s => s.TCNumber == tc);
    }
} 