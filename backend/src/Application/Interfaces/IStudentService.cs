using Application.DTOs;
using Domain.Entities;

namespace Application.Interfaces;

public interface IStudentService
{
    Task<Student> CreateStudentAsync(StudentCreateRequest request);
    Task<List<Student>> GetAllStudentsAsync();
    Task<Student?> FindByTcAsync(string tc);
} 