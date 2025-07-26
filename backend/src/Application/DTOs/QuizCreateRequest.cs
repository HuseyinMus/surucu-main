namespace Application.DTOs
{
    public class QuizCreateRequest
    {
        public Guid? CourseId { get; set; }
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public int TotalPoints { get; set; }
        public string? Status { get; set; }
        public int? Duration { get; set; }
    }
} 