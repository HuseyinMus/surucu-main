namespace Application.DTOs;

public class DocumentResponse
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string DocumentType { get; set; } = null!;
    public string FileUrl { get; set; } = null!;
    public DateTime UploadedAt { get; set; }
} 