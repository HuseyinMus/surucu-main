namespace Domain.Entities;

public enum QuestionType
{
    MultipleChoice,
    TrueFalse
}

public class QuizQuestion
{
    public Guid Id { get; set; }
    public Guid QuizId { get; set; }
    public string QuestionText { get; set; } = null!;
    public QuestionType QuestionType { get; set; }
    // Navigation properties
    public Quiz Quiz { get; set; } = null!;
    public ICollection<QuizOption> Options { get; set; } = new List<QuizOption>();
} 