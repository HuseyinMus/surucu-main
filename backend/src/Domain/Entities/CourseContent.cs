namespace Domain.Entities;

using System.Text.Json.Serialization;

public enum ContentType
{
    Video,
    Text,
    PDF
}

public class CourseContent
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; } // Açıklama
    public ContentType ContentType { get; set; }
    [JsonPropertyName("contentUrl")]
    public string ContentUrl { get; set; } = null!;
    public int Order { get; set; }
    public TimeSpan? Duration { get; set; }
    public Guid? QuizId { get; set; } // İsteğe bağlı quiz
    // Navigation properties
    public Course Course { get; set; } = null!;
    // Quiz navigation (opsiyonel)
    public Quiz? Quiz { get; set; }
} 