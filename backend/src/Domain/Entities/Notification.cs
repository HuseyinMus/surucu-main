namespace Domain.Entities;

public enum NotificationType
{
    SMS,
    Push,
    Info,
    Success,
    Warning,
    Error,
    Reminder,
    Alert,
    Announcement
}

public enum NotificationStatus
{
    Draft,
    Scheduled,
    Sent,
    Failed,
    Cancelled,
    Pending
}

public enum NotificationPriority
{
    Low,
    Normal,
    High,
    Urgent
}

public enum NotificationRecipientType
{
    All,
    Students,
    Instructors,
    Admins,
    Specific
}

public enum NotificationScheduleType
{
    Immediate,
    Scheduled,
    Recurring
}

public enum RecurrenceType
{
    None,
    Daily,
    Weekly,
    Monthly,
    Yearly
}

public class Notification : ITenantEntity
{
    public Guid Id { get; set; }
    public Guid DrivingSchoolId { get; set; }
    public Guid UserId { get; set; } // Target user for the notification
    
    // Basic Information
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public NotificationType Type { get; set; }
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
    public NotificationRecipientType RecipientType { get; set; } = NotificationRecipientType.All;
    
    // Scheduling
    public NotificationScheduleType ScheduleType { get; set; } = NotificationScheduleType.Immediate;
    public DateTime? ScheduledDate { get; set; }
    public RecurrenceType RecurrenceType { get; set; } = RecurrenceType.None;
    public int? RecurrenceInterval { get; set; } // Her X gün/hafta/ay
    public DateTime? RecurrenceEndDate { get; set; }
    public string? RecurrenceDays { get; set; } // JSON array for specific days
    
    // Status and Tracking
    public NotificationStatus Status { get; set; } = NotificationStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SentAt { get; set; }
    public DateTime? LastSentAt { get; set; }
    public int SendAttempts { get; set; } = 0;
    public int MaxSendAttempts { get; set; } = 3;
    
    // Recipients
    public string? RecipientIds { get; set; } // JSON array for specific users
    public int TotalRecipients { get; set; } = 0;
    public int SentToRecipients { get; set; } = 0;
    public int FailedRecipients { get; set; } = 0;
    
    // Analytics
    public int OpenedCount { get; set; } = 0;
    public int ClickedCount { get; set; } = 0;
    public double OpenRate { get; set; } = 0;
    public double ClickRate { get; set; } = 0;
    
    // Template and Rules
    public string? TemplateId { get; set; }
    public string? TriggerCondition { get; set; } // JSON for conditional logic
    public bool IsAutomated { get; set; } = false;
    public string? AutomationRule { get; set; } // JSON for automation rules
    
    // Metadata
    public string? Tags { get; set; } // JSON array for categorization
    public string? Metadata { get; set; } // JSON for additional data
    public string? ErrorMessage { get; set; }
    
    // Navigation properties
    public DrivingSchool DrivingSchool { get; set; } = null!;
    public User User { get; set; } = null!;
    public ICollection<NotificationRecipient> Recipients { get; set; } = new List<NotificationRecipient>();
    public ICollection<NotificationTemplate> Templates { get; set; } = new List<NotificationTemplate>();
}

// Notification Recipient tracking
public class NotificationRecipient
{
    public Guid Id { get; set; }
    public Guid NotificationId { get; set; }
    public Guid UserId { get; set; }
    public DateTime SentAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? OpenedAt { get; set; }
    public DateTime? ClickedAt { get; set; }
    public NotificationStatus Status { get; set; }
    public string? ErrorMessage { get; set; }
    
    // Navigation properties
    public Notification Notification { get; set; } = null!;
    public User User { get; set; } = null!;
}

// Notification Templates
public class NotificationTemplate
{
    public Guid Id { get; set; }
    public Guid DrivingSchoolId { get; set; }
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string TitleTemplate { get; set; } = null!;
    public string MessageTemplate { get; set; } = null!;
    public NotificationType Type { get; set; }
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
    public string? Variables { get; set; } // JSON for template variables
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public DrivingSchool DrivingSchool { get; set; } = null!;
}

// Notification Rules for automation
public class NotificationRule
{
    public Guid Id { get; set; }
    public Guid DrivingSchoolId { get; set; }
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string TriggerEvent { get; set; } = null!; // e.g., "course.created", "exam.scheduled"
    public string Condition { get; set; } = null!; // JSON for conditions
    public Guid TemplateId { get; set; }
    public NotificationRecipientType RecipientType { get; set; }
    public string? RecipientFilter { get; set; } // JSON for filtering recipients
    public bool IsActive { get; set; } = true;
    public int Priority { get; set; } = 0; // Rule priority for execution order
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public DrivingSchool DrivingSchool { get; set; } = null!;
    public NotificationTemplate Template { get; set; } = null!;
} 