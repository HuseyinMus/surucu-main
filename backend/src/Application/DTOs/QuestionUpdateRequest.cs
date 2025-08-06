namespace Application.DTOs;

using System.Text.Json.Serialization;

public class QuestionUpdateRequest
{
    [JsonPropertyName("questionText")]
    public string QuestionText { get; set; } = string.Empty;
    
    [JsonPropertyName("questionType")]
    public string QuestionType { get; set; } = "MultipleChoice";
    
    [JsonPropertyName("mediaType")]
    public string MediaType { get; set; } = "none";
    
    [JsonPropertyName("mediaUrl")]
    public string MediaUrl { get; set; } = string.Empty;
    
    [JsonPropertyName("options")]
    public List<QuestionOptionRequest> Options { get; set; } = new();
}

public class QuestionOptionRequest
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
    
    [JsonPropertyName("isCorrect")]
    public bool IsCorrect { get; set; }
} 