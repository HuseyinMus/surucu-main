using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _service;
    public DocumentsController(IDocumentService service)
    {
        _service = service;
    }

    [HttpPost]
    [Authorize(Roles = "Student,Admin,Instructor")]
    public async Task<IActionResult> Upload([FromForm] DocumentUploadRequest request, [FromForm] IFormFile file)
    {
        var result = await _service.UploadDocumentAsync(request, file);
        return Ok(result);
    }

    [HttpGet("/api/students/{studentId}/documents")]
    [Authorize(Roles = "Student,Admin,Instructor")]
    public async Task<IActionResult> GetStudentDocuments(Guid studentId)
    {
        var result = await _service.GetStudentDocumentsAsync(studentId);
        return Ok(result);
    }
} 