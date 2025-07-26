namespace Application.DTOs;

public class ProgressSummaryDto
{
    public Guid StudentId { get; set; }
    public Guid CourseId { get; set; }
    public string CourseTitle { get; set; } = "";
    public int TotalLessons { get; set; }
    public int CompletedLessons { get; set; }
    public int TotalQuizzes { get; set; }
    public int CompletedQuizzes { get; set; }
    public double AverageQuizScore { get; set; }
    public int TotalTimeSpent { get; set; } // Saniye cinsinden
    public double OverallProgress { get; set; } // Yüzde
    public DateTime LastActivity { get; set; }
    public List<DailyProgressDto> DailyProgress { get; set; } = new();
}

public class DailyProgressDto
{
    public DateTime Date { get; set; }
    public int TimeSpent { get; set; } // Saniye
    public int LessonsCompleted { get; set; }
    public int QuizzesTaken { get; set; }
    public double AverageScore { get; set; }
    public int FocusScore { get; set; }
}

public class LessonProgressDto
{
    public Guid CourseContentId { get; set; }
    public string Title { get; set; } = "";
    public int Progress { get; set; } // 0-100
    public int TimeSpent { get; set; } // Saniye
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int QuizScore { get; set; }
    public int Attempts { get; set; }
    public DateTime LastAccessed { get; set; }
}

public class AnalyticsDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = "";
    public DateTime Date { get; set; }
    public int TotalTimeSpent { get; set; }
    public int LessonsCompleted { get; set; }
    public int QuizzesTaken { get; set; }
    public double AverageQuizScore { get; set; }
    public string PreferredTimeSlot { get; set; } = "";
    public string LearningStyle { get; set; } = "";
    public int FocusScore { get; set; }
} 