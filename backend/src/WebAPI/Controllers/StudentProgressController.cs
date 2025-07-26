using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Infrastructure.Persistence;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StudentProgressController : ControllerBase
{
    private readonly IStudentProgressService _service;
    private readonly AppDbContext _db;
    public StudentProgressController(IStudentProgressService service, AppDbContext db)
    {
        _service = service;
        _db = db;
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Log([FromBody] StudentProgressCreateRequest request)
    {
        var result = await _service.LogProgressAsync(request);
        return Ok(result);
    }

    [HttpGet("{studentId}")]
    [Authorize(Roles = "Student,Instructor,Admin")]
    public async Task<IActionResult> GetProgress(Guid studentId)
    {
        var result = await _service.GetProgressAsync(studentId);
        return Ok(result);
    }

    [HttpGet("/api/students/{studentId}/progress")]
    [Authorize(Roles = "Student,Instructor,Admin")]
    public async Task<IActionResult> GetProgressReport(Guid studentId)
    {
        var student = await _db.Students.FindAsync(studentId);
        if (student == null)
            return NotFound();
        var result = await _service.GetProgressReportAsync(studentId, student.DrivingSchoolId);
        return Ok(result);
    }
} 