using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<DrivingSchool> DrivingSchools => Set<DrivingSchool>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Instructor> Instructors => Set<Instructor>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<CourseContent> CourseContents => Set<CourseContent>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<QuizQuestion> QuizQuestions => Set<QuizQuestion>();
    public DbSet<QuizOption> QuizOptions => Set<QuizOption>();
    public DbSet<QuizResult> QuizResults => Set<QuizResult>();
    public DbSet<Schedule> Schedules => Set<Schedule>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<StudentProgress> StudentProgresses => Set<StudentProgress>();
    public DbSet<StudentAnalytics> StudentAnalytics => Set<StudentAnalytics>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User - Student/Instructor 1-1
        modelBuilder.Entity<User>()
            .HasOne(u => u.Student)
            .WithOne(s => s.User)
            .HasForeignKey<Student>(s => s.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<User>()
            .HasOne(u => u.Instructor)
            .WithOne(i => i.User)
            .HasForeignKey<Instructor>(i => i.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // DrivingSchool - Students/Instructors/Courses 1-n
        modelBuilder.Entity<DrivingSchool>()
            .HasMany(ds => ds.Students)
            .WithOne(s => s.DrivingSchool)
            .HasForeignKey(s => s.DrivingSchoolId);

        modelBuilder.Entity<DrivingSchool>()
            .HasMany(ds => ds.Instructors)
            .WithOne(i => i.DrivingSchool)
            .HasForeignKey(i => i.DrivingSchoolId);

        modelBuilder.Entity<DrivingSchool>()
            .HasMany(ds => ds.Courses)
            .WithOne(c => c.DrivingSchool)
            .HasForeignKey(c => c.DrivingSchoolId);

        // Course - CourseContents/Quizzes 1-n
        modelBuilder.Entity<Course>()
            .HasMany(c => c.CourseContents)
            .WithOne(cc => cc.Course)
            .HasForeignKey(cc => cc.CourseId);

        modelBuilder.Entity<Course>()
            .HasMany(c => c.Quizzes)
            .WithOne(q => q.Course)
            .HasForeignKey(q => q.CourseId);

        // Quiz - QuizQuestions/QuizResults 1-n
        modelBuilder.Entity<Quiz>()
            .HasMany(q => q.Questions)
            .WithOne(qq => qq.Quiz)
            .HasForeignKey(qq => qq.QuizId);

        modelBuilder.Entity<Quiz>()
            .HasMany(q => q.Results)
            .WithOne(qr => qr.Quiz)
            .HasForeignKey(qr => qr.QuizId);

        // QuizQuestion - QuizOptions 1-n
        modelBuilder.Entity<QuizQuestion>()
            .HasMany(qq => qq.Options)
            .WithOne(qo => qo.Question)
            .HasForeignKey(qo => qo.QuestionId);

        // Student - QuizResults/Schedules/Documents/Payments 1-n
        modelBuilder.Entity<Student>()
            .HasMany(s => s.QuizResults)
            .WithOne(qr => qr.Student)
            .HasForeignKey(qr => qr.StudentId);

        modelBuilder.Entity<Student>()
            .HasMany(s => s.Schedules)
            .WithOne(sc => sc.Student)
            .HasForeignKey(sc => sc.StudentId);

        modelBuilder.Entity<Student>()
            .HasMany(s => s.Documents)
            .WithOne(d => d.Student)
            .HasForeignKey(d => d.StudentId);

        modelBuilder.Entity<Student>()
            .HasMany(s => s.Payments)
            .WithOne(p => p.Student)
            .HasForeignKey(p => p.StudentId);

        // Instructor - Schedules 1-n
        modelBuilder.Entity<Instructor>()
            .HasMany(i => i.Schedules)
            .WithOne(sc => sc.Instructor)
            .HasForeignKey(sc => sc.InstructorId);

        // Schedule - Course 1-n
        modelBuilder.Entity<Schedule>()
            .HasOne(sc => sc.Course)
            .WithMany()
            .HasForeignKey(sc => sc.CourseId);

        // Notification - User 1-n
        modelBuilder.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId);

        // StudentProgress - Student/CourseContent
        modelBuilder.Entity<StudentProgress>()
            .HasOne(sp => sp.Student)
            .WithMany()
            .HasForeignKey(sp => sp.StudentId);
        modelBuilder.Entity<StudentProgress>()
            .HasOne(sp => sp.CourseContent)
            .WithMany()
            .HasForeignKey(sp => sp.CourseContentId);

        modelBuilder.Entity<CourseContent>()
            .HasOne(cc => cc.Quiz)
            .WithMany()
            .HasForeignKey(cc => cc.QuizId)
            .OnDelete(DeleteBehavior.SetNull);
    }
} 