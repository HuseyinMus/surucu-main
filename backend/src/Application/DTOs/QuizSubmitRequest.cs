namespace Application.DTOs;

public class QuizSubmitRequest
{
    public int Score { get; set; }
    public int TotalQuestions { get; set; }
    public int CorrectAnswers { get; set; }
    public int TimeSpent { get; set; }
    public List<QuizAnswerRequest> Answers { get; set; } = new();
}

public class QuizAnswerRequest
{
    public Guid QuestionId { get; set; }
    public Guid? SelectedOptionId { get; set; }
    public string? TextAnswer { get; set; }
} 