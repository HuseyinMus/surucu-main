using Application.DTOs;
using Domain.Entities;

namespace Application.Interfaces;

public interface ICourseService
{
    Task<Course> CreateCourseAsync(Course course);
    Task<List<Course>> ListCoursesAsync(Guid drivingSchoolId);
    Task<Course?> GetCourseByIdAsync(Guid id);
    Task UpdateCourseAsync(Course course);
    Task DeleteCourseAsync(Guid id);
} 