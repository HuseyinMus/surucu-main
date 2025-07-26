using Application.DTOs;

namespace Application.Interfaces;

public interface IStudentProgressService
{
    Task<StudentProgressResponse> LogProgressAsync(StudentProgressCreateRequest request);
    Task<List<StudentProgressResponse>> GetProgressAsync(Guid studentId);
    Task<List<StudentProgressReport>> GetProgressReportAsync(Guid studentId, Guid drivingSchoolId);
} 