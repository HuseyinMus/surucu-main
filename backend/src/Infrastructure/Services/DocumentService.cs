using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class DocumentService : IDocumentService
{
    private readonly AppDbContext _db;
    private readonly string _uploadRoot = "uploads";
    public DocumentService(AppDbContext db)
    {
        _db = db;
        if (!Directory.Exists(_uploadRoot))
            Directory.CreateDirectory(_uploadRoot);
    }

    public async Task<DocumentResponse> UploadDocumentAsync(DocumentUploadRequest request, IFormFile file)
    {
        var ext = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(_uploadRoot, fileName);
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }
        var document = new Document
        {
            Id = Guid.NewGuid(),
            StudentId = request.StudentId,
            DocumentType = Enum.Parse<DocumentType>(request.DocumentType, true),
            FileUrl = $"/uploads/{fileName}",
            UploadedAt = DateTime.UtcNow
        };
        _db.Documents.Add(document);
        await _db.SaveChangesAsync();
        return new DocumentResponse
        {
            Id = document.Id,
            StudentId = document.StudentId,
            DocumentType = document.DocumentType.ToString(),
            FileUrl = document.FileUrl,
            UploadedAt = document.UploadedAt
        };
    }

    public async Task<List<DocumentResponse>> GetStudentDocumentsAsync(Guid studentId)
    {
        var documents = await _db.Documents
            .Where(d => d.StudentId == studentId)
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync();
        return documents.Select(document => new DocumentResponse
        {
            Id = document.Id,
            StudentId = document.StudentId,
            DocumentType = document.DocumentType.ToString(),
            FileUrl = document.FileUrl,
            UploadedAt = document.UploadedAt
        }).ToList();
    }
} 