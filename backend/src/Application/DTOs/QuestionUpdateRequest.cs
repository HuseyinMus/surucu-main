namespace Application.DTOs;

public class QuestionUpdateRequest
{
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = "MultipleChoice";
    public string MediaType { get; set; } = "none";
    public string MediaUrl { get; set; } = string.Empty;
    public List<QuestionOptionRequest> Options { get; set; } = new();
}

public class QuestionOptionRequest
{
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
} 