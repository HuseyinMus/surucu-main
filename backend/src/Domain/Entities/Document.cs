namespace Domain.Entities;

public enum DocumentType
{
    Identity,
    HealthReport,
    PaymentReceipt
}

public class Document
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public DocumentType DocumentType { get; set; }
    public string FileUrl { get; set; } = null!;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    // Navigation properties
    public Student Student { get; set; } = null!;
} 