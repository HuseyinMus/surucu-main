namespace Domain.Entities;

public class QuizResult
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid QuizId { get; set; }
    public int Score { get; set; }
    public DateTime CompletedAt { get; set; }
    // Navigation properties
    public Student Student { get; set; } = null!;
    public Quiz Quiz { get; set; } = null!;
} 