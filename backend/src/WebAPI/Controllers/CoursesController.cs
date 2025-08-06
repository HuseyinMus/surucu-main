using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Persistence;
using System.Text.Json.Serialization;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CoursesController : ControllerBase
{
    private readonly ICourseService _courseService;
    private readonly AppDbContext _db;
    public CoursesController(ICourseService courseService, AppDbContext db)
    {
        _courseService = courseService;
        _db = db;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> Create([FromBody] CourseCreateRequest request)
    {
        var course = new Course
        {
            Title = request.Title,
            Description = request.Description,
            Category = request.Category,
            CourseType = Enum.Parse<CourseType>(request.CourseType, true),
            CreatedAt = DateTime.UtcNow,
            DrivingSchoolId = request.DrivingSchoolId,
            VideoUrl = request.VideoUrl,
            ImageUrl = request.ImageUrl,
            PdfUrl = request.PdfUrl
        };
        await _courseService.CreateCourseAsync(course);
        return Ok(course);
    }

    [HttpPost("upload-media")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> UploadMedia([FromForm] IFormFile? video, [FromForm] IFormFile? image, [FromForm] IFormFile? pdf)
    {
        var uploadRoot = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        if (!Directory.Exists(uploadRoot)) Directory.CreateDirectory(uploadRoot);
        string? videoUrl = null, imageUrl = null, pdfUrl = null;
        
        if (video != null)
        {
            var ext = Path.GetExtension(video.FileName);
            var fileName = $"video_{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(uploadRoot, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
                await video.CopyToAsync(stream);
            videoUrl = $"/uploads/{fileName}";
        }
        
        if (image != null)
        {
            var ext = Path.GetExtension(image.FileName);
            var fileName = $"image_{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(uploadRoot, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
                await image.CopyToAsync(stream);
            imageUrl = $"/uploads/{fileName}";
        }
        
        if (pdf != null)
        {
            var ext = Path.GetExtension(pdf.FileName);
            var fileName = $"pdf_{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(uploadRoot, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
                await pdf.CopyToAsync(stream);
            pdfUrl = $"/uploads/{fileName}";
        }
        
        return Ok(new { videoUrl, imageUrl, pdfUrl });
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> List()
    {
        Guid drivingSchoolId;
        var claim = User.FindFirst("DrivingSchoolId")?.Value;
        
        if (claim != null && Guid.TryParse(claim, out var parsedId))
            drivingSchoolId = parsedId;
        else
            drivingSchoolId = Guid.Empty;
        
        // DrivingSchoolId'ye göre filtrele
        var courses = await _db.Courses
            .Include(c => c.CourseContents)
            .Where(c => c.DrivingSchoolId == drivingSchoolId)
            .ToListAsync();

        // Sadece temel alanları ve courseContents'in temel alanlarını döndür
        var result = courses.Select(c => new {
            c.Id,
            c.Title,
            c.Description,
            c.Category,
            c.CourseType,
            c.CreatedAt,
            c.DrivingSchoolId,
            c.VideoUrl,
            c.ImageUrl,
            c.PdfUrl,
            courseContents = c.CourseContents.Select(cc => new {
                cc.Id,
                cc.Title,
                cc.Description,
                cc.ContentType,
                cc.ContentUrl,
                cc.Order,
                cc.Duration,
                cc.QuizId
            })
        });

        return Ok(result);
    }

    [HttpGet("{id}/contents")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCourseContents([FromRoute] Guid id)
    {
        // DrivingSchoolId'yi al
        Guid drivingSchoolId;
        var claim = User.FindFirst("DrivingSchoolId")?.Value;
        
        if (claim != null && Guid.TryParse(claim, out var parsedId))
            drivingSchoolId = parsedId;
        else
            drivingSchoolId = Guid.Empty;

        var course = await _db.Courses
            .Include(c => c.CourseContents)
            .Where(c => c.Id == id && c.DrivingSchoolId == drivingSchoolId)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (course == null)
            return NotFound();
        var contents = course.CourseContents.OrderBy(cc => cc.Order).Select(cc => new {
            cc.Id,
            cc.Title,
            cc.Description,
            cc.ContentType,
            cc.ContentUrl,
            cc.Order,
            cc.Duration,
            cc.QuizId
        });
        return Ok(contents);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById([FromRoute] Guid id)
    {
        // DrivingSchoolId'yi al
        Guid drivingSchoolId;
        var claim = User.FindFirst("DrivingSchoolId")?.Value;
        
        if (claim != null && Guid.TryParse(claim, out var parsedId))
            drivingSchoolId = parsedId;
        else
            drivingSchoolId = Guid.Empty;

        var course = await _db.Courses
            .Include(c => c.CourseContents)
            .Where(c => c.Id == id && c.DrivingSchoolId == drivingSchoolId)
            .FirstOrDefaultAsync();
        if (course == null)
            return NotFound();

        // Sadece temel alanları ve courseContents'in temel alanlarını döndür
        var result = new {
            course.Id,
            course.Title,
            course.Description,
            course.Category,
            course.CourseType,
            course.CreatedAt,
            course.DrivingSchoolId,
            course.VideoUrl,
            course.ImageUrl,
            course.PdfUrl,
            courseContents = course.CourseContents.Select(cc => new {
                cc.Id,
                cc.Title,
                cc.Description,
                cc.ContentType,
                cc.ContentUrl,
                cc.Order,
                cc.Duration,
                cc.QuizId
            })
        };

        return Ok(result);
    }

    [HttpPost("{courseId}/contents")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> AddContent([FromRoute] Guid courseId, [FromBody] Dictionary<string, object> request)
    {
        try
        {
            Console.WriteLine($"Gelen content request: {System.Text.Json.JsonSerializer.Serialize(request)}");
            
            var course = await _db.Courses.Include(c => c.CourseContents).FirstOrDefaultAsync(c => c.Id == courseId);
            if (course == null) return NotFound();
            
            // Frontend'den gelen veriyi parse et
            var title = request.ContainsKey("title") ? request["title"]?.ToString() ?? "" : "";
            var description = request.ContainsKey("description") ? request["description"]?.ToString() ?? "" : "";
            var contentUrl = request.ContainsKey("contentUrl") ? request["contentUrl"]?.ToString() ?? "" : "";
            var contentType = request.ContainsKey("contentType") ? request["contentType"]?.ToString() ?? "0" : "0";
            var order = request.ContainsKey("order") ? request["order"]?.ToString() ?? "0" : "0";
            var duration = request.ContainsKey("duration") ? request["duration"]?.ToString() ?? "" : "";
            
            Console.WriteLine($"Parsed data - Title: {title}, ContentType: {contentType}, Order: {order}");
            
            // ContentType'ı enum'a çevir
            ContentType contentTypeEnum;
            switch (contentType)
            {
                case "0": contentTypeEnum = ContentType.Video; break;
                case "1": contentTypeEnum = ContentType.Text; break;
                case "2": contentTypeEnum = ContentType.PDF; break;
                default: contentTypeEnum = ContentType.Video; break;
            }
            
            // Duration'ı hesapla
            TimeSpan? durationSpan = null;
            if (!string.IsNullOrEmpty(duration))
            {
                if (int.TryParse(duration, out int parsedDuration))
                {
                    durationSpan = TimeSpan.FromMinutes(parsedDuration);
                }
            }
            
            var content = new CourseContent
            {
                Id = Guid.NewGuid(),
                CourseId = courseId,
                Title = title,
                Description = description,
                ContentUrl = contentUrl,
                ContentType = contentTypeEnum,
                Order = int.TryParse(order, out int orderValue) ? orderValue : 0,
                Duration = durationSpan,
                QuizId = null
            };
            
            _db.CourseContents.Add(content);
            await _db.SaveChangesAsync();
            
            return Ok(new {
                content.Id,
                content.Title,
                content.Description,
                content.ContentType,
                content.ContentUrl,
                content.Order,
                content.Duration,
                content.QuizId
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Content ekleme hatası: {ex.Message}");
            return BadRequest($"İçerik eklenirken hata: {ex.Message}");
        }
    }

    [HttpPut("{courseId}/contents/{contentId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> UpdateContent([FromRoute] Guid courseId, [FromRoute] Guid contentId, [FromBody] CourseContent updated)
    {
        var content = await _db.CourseContents.FirstOrDefaultAsync(cc => cc.Id == contentId && cc.CourseId == courseId);
        if (content == null) return NotFound();
        content.Title = updated.Title;
        content.Description = updated.Description;
        content.ContentType = updated.ContentType;
        content.ContentUrl = updated.ContentUrl;
        content.Order = updated.Order;
        content.Duration = updated.Duration;
        content.QuizId = updated.QuizId;
        await _db.SaveChangesAsync();
        return Ok(content);
    }

    [HttpDelete("{courseId}/contents/{contentId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> DeleteContent([FromRoute] Guid courseId, [FromRoute] Guid contentId)
    {
        var content = await _db.CourseContents.FirstOrDefaultAsync(cc => cc.Id == contentId && cc.CourseId == courseId);
        if (content == null) return NotFound();
        _db.CourseContents.Remove(content);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{courseId}/add-default-modules")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> AddDefaultModules([FromRoute] Guid courseId)
    {
        var course = await _db.Courses.Include(c => c.CourseContents).FirstOrDefaultAsync(c => c.Id == courseId);
        if (course == null) return NotFound();
        var modules = new[] {
            new CourseContent {
                Id = Guid.NewGuid(),
                CourseId = courseId,
                Title = "Trafik ve Çevre Bilgisi",
                Description = "Trafik kuralları, işaretler, çevre bilinci, park etme, trafik ışıkları, yol yapısı, vs.",
                ContentType = ContentType.Video,
                ContentUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                Order = 1,
                Duration = TimeSpan.FromMinutes(15)
            },
            new CourseContent {
                Id = Guid.NewGuid(),
                CourseId = courseId,
                Title = "İlk Yardım",
                Description = "Kaza anı, temel yaşam desteği, kanama, şok, kırık, taşıma teknikleri, vs.",
                ContentType = ContentType.Video,
                ContentUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                Order = 2,
                Duration = TimeSpan.FromMinutes(12)
            },
            new CourseContent {
                Id = Guid.NewGuid(),
                CourseId = courseId,
                Title = "Araç Tekniği (Motor Bilgisi)",
                Description = "Motor yapısı, bakım, elektrik sistemi, fren, arıza, vs.",
                ContentType = ContentType.Video,
                ContentUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                Order = 3,
                Duration = TimeSpan.FromMinutes(10)
            },
            new CourseContent {
                Id = Guid.NewGuid(),
                CourseId = courseId,
                Title = "Trafik Adabı ve Davranış Bilgisi",
                Description = "Trafik etiği, sorumluluk, stres yönetimi, empati, vs.",
                ContentType = ContentType.Text,
                ContentUrl = "https://www.emniyet.gov.tr/trafik-kurallari",
                Order = 4,
                Duration = TimeSpan.FromMinutes(8)
            }
        };
        _db.CourseContents.AddRange(modules);
        await _db.SaveChangesAsync();
        return Ok(modules);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CourseCreateRequest request)
    {
        var course = await _courseService.GetCourseByIdAsync(id);
        if (course == null) return NotFound();
        course.Title = request.Title;
        course.Description = request.Description;
        course.Category = request.Category;
        course.CourseType = Enum.Parse<CourseType>(request.CourseType, true);
        course.VideoUrl = request.VideoUrl;
        course.ImageUrl = request.ImageUrl;
        course.PdfUrl = request.PdfUrl;
        course.Tags = request.Tags;
        await _courseService.UpdateCourseAsync(course);
        return Ok(course);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var course = await _courseService.GetCourseByIdAsync(id);
        if (course == null) return NotFound();
        await _courseService.DeleteCourseAsync(id);
        return NoContent();
    }
} 