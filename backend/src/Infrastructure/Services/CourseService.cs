using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class CourseService : ICourseService
{
    private readonly AppDbContext _db;
    public CourseService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Course> CreateCourseAsync(Course course)
    {
        _db.Courses.Add(course);
        await _db.SaveChangesAsync();
        return course;
    }

    public async Task<List<Course>> ListCoursesAsync()
    {
        return await _db.Courses.ToListAsync();
    }

    public async Task<List<Course>> ListCoursesAsync(Guid drivingSchoolId)
    {
        return await _db.Courses.Where(c => c.DrivingSchoolId == drivingSchoolId).ToListAsync();
    }

    public async Task<Course?> GetCourseByIdAsync(Guid id)
    {
        return await _db.Courses.FindAsync(id);
    }

    public async Task UpdateCourseAsync(Course course)
    {
        _db.Courses.Update(course);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteCourseAsync(Guid id)
    {
        var course = await _db.Courses.FindAsync(id);
        if (course != null)
        {
            _db.Courses.Remove(course);
            await _db.SaveChangesAsync();
        }
    }
} 