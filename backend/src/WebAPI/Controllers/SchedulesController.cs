using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SchedulesController : ControllerBase
{
    private readonly IScheduleService _service;
    public SchedulesController(IScheduleService service)
    {
        _service = service;
    }

    [HttpPost]
    [Authorize(Roles = "Instructor,Admin")]
    public async Task<IActionResult> Create([FromBody] ScheduleCreateRequest request)
    {
        var result = await _service.CreateScheduleAsync(request);
        return Ok(result);
    }

    [HttpGet("student/{studentId}")]
    [Authorize(Roles = "Student,Instructor,Admin")]
    public async Task<IActionResult> GetStudentSchedules(Guid studentId)
    {
        var result = await _service.GetStudentSchedulesAsync(studentId);
        return Ok(result);
    }
} 