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
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!)),
        ClockSkew = TimeSpan.Zero // Token süresini tam olarak kontrol et
    };
    
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine($"JWT Authentication failed: {context.Exception.Message}");
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            Console.WriteLine("JWT Token validated successfully");
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// Scoped services...
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

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://localhost:8080")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .SetIsOriginAllowed(origin => true); // Mobile app için tüm origin'leri kabul et
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.CustomSchemaIds(type => type.FullName!.Replace("+", "."));

    // Swagger JWT Bearer Authentication configuration
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = @"JWT Authorization header using the Bearer scheme. 
Enter 'Bearer' [space] and then your token in the text input below.
Example: 'Bearer abcdef12345'",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement()
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header,

            },
            new List<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "uploads")),
    RequestPath = "/uploads",
    OnPrepareResponse = context =>
    {
        var file = context.File;
        var fileName = file.Name.ToLowerInvariant();

        // Video dosyaları için
        if (fileName.EndsWith(".mp4") || fileName.EndsWith(".avi") || fileName.EndsWith(".mov"))
        {
            if (!context.Context.Response.Headers.ContainsKey("Accept-Ranges"))
                context.Context.Response.Headers.Add("Accept-Ranges", "bytes");

            if (!context.Context.Response.Headers.ContainsKey("Cache-Control"))
                context.Context.Response.Headers.Add("Cache-Control", "public, max-age=31536000");
        }

        // PDF dosyaları için
        if (fileName.EndsWith(".pdf"))
        {
            if (!context.Context.Response.Headers.ContainsKey("Content-Type"))
                context.Context.Response.Headers.Add("Content-Type", "application/pdf");

            if (!context.Context.Response.Headers.ContainsKey("Cache-Control"))
                context.Context.Response.Headers.Add("Cache-Control", "public, max-age=31536000");

            if (!context.Context.Response.Headers.ContainsKey("Content-Disposition"))
                context.Context.Response.Headers.Add("Content-Disposition", "inline");
        }

        // CORS headers
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

async Task SeedTestDataAsync(AppDbContext db)
{
    try
    {
        await db.Database.EnsureCreatedAsync();

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

            var student = new Domain.Entities.Student
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                DrivingSchoolId = drivingSchool.Id,
                TCNumber = "12345678901",
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
