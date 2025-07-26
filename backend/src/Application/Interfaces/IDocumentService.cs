using Application.DTOs;
using Microsoft.AspNetCore.Http;

namespace Application.Interfaces;

public interface IDocumentService
{
    Task<DocumentResponse> UploadDocumentAsync(DocumentUploadRequest request, IFormFile file);
    Task<List<DocumentResponse>> GetStudentDocumentsAsync(Guid studentId);
} 