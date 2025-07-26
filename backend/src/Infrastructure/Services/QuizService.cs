using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class QuizService : IQuizService
{
    private readonly AppDbContext _db;
    public QuizService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<Quiz>> ListQuizzesAsync()
    {
        return await _db.Quizzes.ToListAsync();
    }

    public async Task<List<Quiz>> ListQuizzesAsync(Guid drivingSchoolId)
    {
        return await _db.Quizzes.Where(q => q.DrivingSchoolId == drivingSchoolId).ToListAsync();
    }
} 