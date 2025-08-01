namespace Domain.Entities;

public class QuizSession
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid QuizId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public bool IsCompleted { get; set; }
    public int? TimeSpent { get; set; }
    
    // Navigation properties
    public Student Student { get; set; } = null!;
    public Quiz Quiz { get; set; } = null!;
} 