namespace Domain.Entities;

public class QuizOption
{
    public Guid Id { get; set; }
    public Guid QuestionId { get; set; }
    public string OptionText { get; set; } = null!;
    public bool IsCorrect { get; set; }
    // Navigation properties
    public QuizQuestion Question { get; set; } = null!;
} 