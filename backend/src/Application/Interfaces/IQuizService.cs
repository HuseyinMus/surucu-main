using Domain.Entities;

namespace Application.Interfaces;

public interface IQuizService
{
    Task<List<Quiz>> ListQuizzesAsync(Guid drivingSchoolId);
} 