namespace Domain.Entities;

public class StudentProgress
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid CourseContentId { get; set; }
    public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
    public int Progress { get; set; } // 0-100 (yüzde)
    public int TimeSpent { get; set; } // Saniye cinsinden geçirilen süre
    public bool IsCompleted { get; set; } = false;
    public DateTime? CompletedAt { get; set; }
    public int QuizScore { get; set; } = 0; // İlgili quiz'den alınan puan
    public int Attempts { get; set; } = 0; // Deneme sayısı
    public string? Notes { get; set; } // Öğrenci notları
    public DateTime LastAccessed { get; set; } = DateTime.UtcNow;
    
    // Navigation
    public Student Student { get; set; } = null!;
    public CourseContent CourseContent { get; set; } = null!;
} 