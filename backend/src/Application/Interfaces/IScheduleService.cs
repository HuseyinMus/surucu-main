using Application.DTOs;

namespace Application.Interfaces;

public interface IScheduleService
{
    Task<ScheduleResponse> CreateScheduleAsync(ScheduleCreateRequest request);
    Task<List<ScheduleResponse>> GetStudentSchedulesAsync(Guid studentId);
} 