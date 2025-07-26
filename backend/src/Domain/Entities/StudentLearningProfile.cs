namespace Domain.Entities;

public class StudentLearningProfile
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid DrivingSchoolId { get; set; }
    
    // Öğrenme Tercihleri
    public string PreferredLearningStyle { get; set; } = "Visual"; // Visual, Auditory, Kinesthetic
    public int StudySessionDuration { get; set; } = 30; // Dakika
    public string PreferredTimeOfDay { get; set; } = "Morning"; // Morning, Afternoon, Evening, Night
    public bool PrefersVideoContent { get; set; } = true;
    public bool PrefersInteractiveContent { get; set; } = true;
    
    // Performans Metrikleri
    public double AverageQuizScore { get; set; } = 0;
    public int TotalStudyTime { get; set; } = 0; // Dakika
    public int CompletedLessons { get; set; } = 0;
    public int CompletedQuizzes { get; set; } = 0;
    
    // Güçlü/Zayıf Konular
    public string StrongTopics { get; set; } = ""; // JSON string
    public string WeakTopics { get; set; } = ""; // JSON string
    
    // AI Önerileri
    public string RecommendedNextLessons { get; set; } = ""; // JSON string
    public string StudyRecommendations { get; set; } = ""; // JSON string
    public string DifficultyLevel { get; set; } = "Beginner"; // Beginner, Intermediate, Advanced
    
    // Zaman Damgaları
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    
    // Navigation
    public Student Student { get; set; } = null!;
    public DrivingSchool DrivingSchool { get; set; } = null!;
} 