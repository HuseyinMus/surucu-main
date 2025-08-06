using Microsoft.AspNetCore.Http;

namespace Application.DTOs;

public class DocumentUploadRequest
{
    public Guid StudentId { get; set; }
    public string DocumentType { get; set; } = null!; // Identity, HealthReport, PaymentReceipt
        public IFormFile File { get; set; } = null!;

} 