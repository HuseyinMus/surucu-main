namespace Domain.Entities;

public class StudentAnalytics
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid CourseId { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    
    // Günlük aktivite metrikleri
    public int TotalTimeSpent { get; set; } // Günlük toplam süre (saniye)
    public int LessonsCompleted { get; set; } // Tamamlanan ders sayısı
    public int QuizzesTaken { get; set; } // Alınan quiz sayısı
    public double AverageQuizScore { get; set; } // Ortalama quiz puanı
    public int TotalAttempts { get; set; } // Toplam deneme sayısı
    
    // Öğrenme davranışı
    public string PreferredTimeSlot { get; set; } = ""; // Tercih edilen saat aralığı
    public string LearningStyle { get; set; } = ""; // Öğrenme stili (visual, auditory, kinesthetic)
    public int FocusScore { get; set; } = 0; // Odaklanma skoru (0-100)
    
    // Navigation
    public Student Student { get; set; } = null!;
    public Course Course { get; set; } = null!;
} 