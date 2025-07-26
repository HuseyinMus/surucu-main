using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using MediatR;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// MediatR for CQRS
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<Program>());

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!))
    };
});

builder.Services.AddAuthorization();
// Add Identity (custom implementation, not ASP.NET Identity)
// You can add password hashing and user management services here
builder.Services.AddScoped<Application.Interfaces.IAuthService, Infrastructure.Services.AuthService>();
builder.Services.AddScoped<Application.Interfaces.IStudentService, Infrastructure.Services.StudentService>();
builder.Services.AddScoped<Application.Interfaces.ICourseService, Infrastructure.Services.CourseService>();
builder.Services.AddScoped<Application.Interfaces.IQuizService, Infrastructure.Services.QuizService>();
builder.Services.AddScoped<Application.Interfaces.IStudentProgressService, Infrastructure.Services.StudentProgressService>();
builder.Services.AddScoped<Application.Interfaces.IScheduleService, Infrastructure.Services.ScheduleService>();
builder.Services.AddScoped<Application.Interfaces.INotificationService, Infrastructure.Services.NotificationService>();
builder.Services.AddScoped<Application.Interfaces.IDocumentService, Infrastructure.Services.DocumentService>();
builder.Services.AddScoped<Application.Interfaces.IProgressTrackingService, Infrastructure.Services.ProgressTrackingService>();
builder.Services.AddSingleton<Application.Interfaces.ISmsSender, Infrastructure.Services.SmsSender>();
builder.Services.AddSingleton<Microsoft.AspNetCore.Identity.IPasswordHasher<Domain.Entities.User>, Microsoft.AspNetCore.Identity.PasswordHasher<Domain.Entities.User>>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://192.168.1.78:5068")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .SetIsOriginAllowed(origin => true); // Mobile app için tüm origin'leri kabul et
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
// Statik dosya sunumu (uploads klasörü için)
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "uploads")),
    RequestPath = "/uploads",
    OnPrepareResponse = context =>
    {
        // Video dosyaları için özel headers (sadece eksik olanları ekle)
        var file = context.File;
        var fileName = file.Name.ToLowerInvariant();
        
        if (fileName.EndsWith(".mp4") || fileName.EndsWith(".avi") || fileName.EndsWith(".mov"))
        {
            // Video dosyaları için range support
            if (!context.Context.Response.Headers.ContainsKey("Accept-Ranges"))
                context.Context.Response.Headers.Add("Accept-Ranges", "bytes");
            
            if (!context.Context.Response.Headers.ContainsKey("Cache-Control"))
                context.Context.Response.Headers.Add("Cache-Control", "public, max-age=31536000");
        }
        
        // CORS headers for media files (sadece eksik olanları ekle)
        if (!context.Context.Response.Headers.ContainsKey("Access-Control-Allow-Origin"))
            context.Context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
        
        if (!context.Context.Response.Headers.ContainsKey("Access-Control-Allow-Methods"))
            context.Context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        
        if (!context.Context.Response.Headers.ContainsKey("Access-Control-Allow-Headers"))
            context.Context.Response.Headers.Add("Access-Control-Allow-Headers", "Range");
    }
});
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Test verisi oluştur (sadece development ortamında)
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await SeedTestDataAsync(db);
}

app.Run();

// Test verisi oluşturma metodu
async Task SeedTestDataAsync(AppDbContext db)
{
    try
    {
        // Database oluştur (eğer yoksa)
        await db.Database.EnsureCreatedAsync();

        // Test driving school oluştur
        if (!await db.DrivingSchools.AnyAsync())
        {
            var drivingSchool = new Domain.Entities.DrivingSchool
            {
                Id = Guid.NewGuid(),
                Name = "Esen Sürücü Kursu",
                Address = "İstanbul, Türkiye",
                Phone = "555-123-4567",
                Email = "info@esensurucu.com",
                CreatedAt = DateTime.UtcNow
            };
            db.DrivingSchools.Add(drivingSchool);
            await db.SaveChangesAsync();

            // Test user oluştur
            var user = new Domain.Entities.User
            {
                Id = Guid.NewGuid(),
                FullName = "Ahmet Yılmaz",
                Email = "ahmet.yilmaz@email.com",
                Role = Domain.Entities.UserRole.Student,
                DrivingSchoolId = drivingSchool.Id,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            
            var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<Domain.Entities.User>();
            user.PasswordHash = hasher.HashPassword(user, "password123");
            
            db.Users.Add(user);
            await db.SaveChangesAsync();

            // Test student oluştur
            var student = new Domain.Entities.Student
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                DrivingSchoolId = drivingSchool.Id,
                TCNumber = "12345678901", // Test TC numarası
                BirthDate = DateTime.UtcNow.AddYears(-25),
                LicenseType = "B",
                RegistrationDate = DateTime.UtcNow,
                CurrentStage = Domain.Entities.StudentStage.Theory,
                PhoneNumber = "555-987-6543",
                Gender = "Erkek"
            };
            
            db.Students.Add(student);
            await db.SaveChangesAsync();
            
            Console.WriteLine("Test verisi başarıyla oluşturuldu!");
            Console.WriteLine("Test TC: 12345678901");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Test verisi oluşturma hatası: {ex.Message}");
    }
}
