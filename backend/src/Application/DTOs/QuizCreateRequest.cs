namespace Application.DTOs
{
    public class QuizCreateRequest
    {
        public Guid DrivingSchoolId { get; set; }
        public Guid CourseId { get; set; }
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public int TotalPoints { get; set; }
        public Guid? CourseContentId { get; set; }
    }
} 