namespace Application.DTOs
{
    public class CourseContentCreateRequest
    {
        public string Title { get; set; }
        public string? Description { get; set; }
        public string ContentUrl { get; set; }
        public string ContentType { get; set; }
        public int Order { get; set; }
        public string? Duration { get; set; }
        public Guid? QuizId { get; set; }
    }
} 