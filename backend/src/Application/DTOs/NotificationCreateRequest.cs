namespace Application.DTOs;

public class NotificationCreateRequest
{
    // Required fields for service
    public Guid DrivingSchoolId { get; set; }
    public Guid UserId { get; set; } = Guid.Empty; // Optional, will be set automatically if empty
    
    // Basic Information
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string Type { get; set; } = "Info"; // Info, Success, Warning, Error, Reminder, Alert, Announcement
    public string Priority { get; set; } = "Normal"; // Low, Normal, High, Urgent
    public string RecipientType { get; set; } = "All"; // All, Students, Instructors, Admins, Specific
    
    // Scheduling
    public string ScheduleType { get; set; } = "Immediate"; // Immediate, Scheduled, Recurring
    public DateTime? ScheduledDate { get; set; }
    public string RecurrenceType { get; set; } = "None"; // None, Daily, Weekly, Monthly, Yearly
    public int? RecurrenceInterval { get; set; }
    public DateTime? RecurrenceEndDate { get; set; }
    public List<string>? RecurrenceDays { get; set; } // ["Monday", "Wednesday", "Friday"]
    
    // Recipients
    public List<Guid>? RecipientIds { get; set; } // For specific users
    public string? RecipientFilter { get; set; } // JSON for advanced filtering
    
    // Template
    public Guid? TemplateId { get; set; }
    public Dictionary<string, object>? TemplateVariables { get; set; }
    
    // Automation
    public bool IsAutomated { get; set; } = false;
    public string? AutomationRule { get; set; } // JSON for automation rules
    public string? TriggerCondition { get; set; } // JSON for conditional logic
    
    // Metadata
    public List<string>? Tags { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}



public class NotificationTemplateCreateRequest
{
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string TitleTemplate { get; set; } = null!;
    public string MessageTemplate { get; set; } = null!;
    public string Type { get; set; } = "Info";
    public string Priority { get; set; } = "Normal";
    public Dictionary<string, string>? Variables { get; set; } // Variable name -> description
}

public class NotificationTemplateResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string TitleTemplate { get; set; } = null!;
    public string MessageTemplate { get; set; } = null!;
    public string Type { get; set; } = null!;
    public string Priority { get; set; } = null!;
    public Dictionary<string, string>? Variables { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class NotificationRuleCreateRequest
{
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string TriggerEvent { get; set; } = null!; // e.g., "course.created"
    public Dictionary<string, object>? Condition { get; set; }
    public Guid TemplateId { get; set; }
    public string RecipientType { get; set; } = "All";
    public Dictionary<string, object>? RecipientFilter { get; set; }
    public int Priority { get; set; } = 0;
}

public class NotificationRuleResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string TriggerEvent { get; set; } = null!;
    public Dictionary<string, object>? Condition { get; set; }
    public Guid TemplateId { get; set; }
    public string RecipientType { get; set; } = null!;
    public Dictionary<string, object>? RecipientFilter { get; set; }
    public bool IsActive { get; set; }
    public int Priority { get; set; }
    public DateTime CreatedAt { get; set; }
    public NotificationTemplateResponse Template { get; set; } = null!;
}

public class NotificationAnalyticsResponse
{
    public int TotalNotifications { get; set; }
    public int SentNotifications { get; set; }
    public int FailedNotifications { get; set; }
    public int PendingNotifications { get; set; }
    public int ScheduledNotifications { get; set; }
    
    public double AverageOpenRate { get; set; }
    public double AverageClickRate { get; set; }
    public int TotalRecipients { get; set; }
    public int TotalOpens { get; set; }
    public int TotalClicks { get; set; }
    
    public Dictionary<string, int> NotificationsByType { get; set; } = new();
    public Dictionary<string, int> NotificationsByStatus { get; set; } = new();
    public List<NotificationTrendData> Trends { get; set; } = new();
}

public class NotificationTrendData
{
    public DateTime Date { get; set; }
    public int Sent { get; set; }
    public int Opened { get; set; }
    public int Clicked { get; set; }
    public double OpenRate { get; set; }
    public double ClickRate { get; set; }
}

public class NotificationResendRequest
{
    public Guid NotificationId { get; set; }
    public List<Guid>? RecipientIds { get; set; } // If null, resend to all original recipients
    public DateTime? NewScheduledDate { get; set; }
    public string? CustomMessage { get; set; } // Optional custom message override
} 