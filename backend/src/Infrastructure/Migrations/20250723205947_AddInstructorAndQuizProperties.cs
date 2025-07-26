using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInstructorAndQuizProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LeaderboardEntries");

            migrationBuilder.DropTable(
                name: "StudentAchievements");

            migrationBuilder.DropTable(
                name: "Leaderboards");

            migrationBuilder.DropTable(
                name: "Achievements");

            migrationBuilder.DropColumn(
                name: "AverageQuizScore",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "CompletedCourses",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "CompletedQuizzes",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "ConsecutivePerfectScores",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "CurrentBadge",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "EarnedBadges",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "ExperiencePoints",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "LastActivityDate",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "Level",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "PerfectScores",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "StreakDays",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "TotalPoints",
                table: "Students");

            migrationBuilder.AddColumn<int>(
                name: "Attempts",
                table: "StudentProgresses",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "StudentProgresses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCompleted",
                table: "StudentProgresses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastAccessed",
                table: "StudentProgresses",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "StudentProgresses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "QuizScore",
                table: "StudentProgresses",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TimeSpent",
                table: "StudentProgresses",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Quizzes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Experience",
                table: "Instructors",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "HireDate",
                table: "Instructors",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Instructors",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "Rating",
                table: "Instructors",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "Specialization",
                table: "Instructors",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "StudentAnalytics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TotalTimeSpent = table.Column<int>(type: "integer", nullable: false),
                    LessonsCompleted = table.Column<int>(type: "integer", nullable: false),
                    QuizzesTaken = table.Column<int>(type: "integer", nullable: false),
                    AverageQuizScore = table.Column<double>(type: "double precision", nullable: false),
                    TotalAttempts = table.Column<int>(type: "integer", nullable: false),
                    PreferredTimeSlot = table.Column<string>(type: "text", nullable: false),
                    LearningStyle = table.Column<string>(type: "text", nullable: false),
                    FocusScore = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentAnalytics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentAnalytics_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentAnalytics_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StudentAnalytics_CourseId",
                table: "StudentAnalytics",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentAnalytics_StudentId",
                table: "StudentAnalytics",
                column: "StudentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StudentAnalytics");

            migrationBuilder.DropColumn(
                name: "Attempts",
                table: "StudentProgresses");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "StudentProgresses");

            migrationBuilder.DropColumn(
                name: "IsCompleted",
                table: "StudentProgresses");

            migrationBuilder.DropColumn(
                name: "LastAccessed",
                table: "StudentProgresses");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "StudentProgresses");

            migrationBuilder.DropColumn(
                name: "QuizScore",
                table: "StudentProgresses");

            migrationBuilder.DropColumn(
                name: "TimeSpent",
                table: "StudentProgresses");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "Experience",
                table: "Instructors");

            migrationBuilder.DropColumn(
                name: "HireDate",
                table: "Instructors");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Instructors");

            migrationBuilder.DropColumn(
                name: "Rating",
                table: "Instructors");

            migrationBuilder.DropColumn(
                name: "Specialization",
                table: "Instructors");

            migrationBuilder.AddColumn<double>(
                name: "AverageQuizScore",
                table: "Students",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "CompletedCourses",
                table: "Students",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CompletedQuizzes",
                table: "Students",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ConsecutivePerfectScores",
                table: "Students",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CurrentBadge",
                table: "Students",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EarnedBadges",
                table: "Students",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "ExperiencePoints",
                table: "Students",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastActivityDate",
                table: "Students",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "Level",
                table: "Students",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PerfectScores",
                table: "Students",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "StreakDays",
                table: "Students",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalPoints",
                table: "Students",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Achievements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DrivingSchoolId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    IconUrl = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    PointsReward = table.Column<int>(type: "integer", nullable: false),
                    RequiredValue = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Achievements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Achievements_DrivingSchools_DrivingSchoolId",
                        column: x => x.DrivingSchoolId,
                        principalTable: "DrivingSchools",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Leaderboards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DrivingSchoolId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Leaderboards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Leaderboards_DrivingSchools_DrivingSchoolId",
                        column: x => x.DrivingSchoolId,
                        principalTable: "DrivingSchools",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentAchievements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AchievementId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    EarnedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PointsEarned = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentAchievements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentAchievements_Achievements_AchievementId",
                        column: x => x.AchievementId,
                        principalTable: "Achievements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentAchievements_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LeaderboardEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LeaderboardId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    AverageScore = table.Column<double>(type: "double precision", nullable: false),
                    CompletedCourses = table.Column<int>(type: "integer", nullable: false),
                    CompletedQuizzes = table.Column<int>(type: "integer", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    Points = table.Column<int>(type: "integer", nullable: false),
                    Rank = table.Column<int>(type: "integer", nullable: false),
                    StreakDays = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeaderboardEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LeaderboardEntries_Leaderboards_LeaderboardId",
                        column: x => x.LeaderboardId,
                        principalTable: "Leaderboards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LeaderboardEntries_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Achievements_DrivingSchoolId",
                table: "Achievements",
                column: "DrivingSchoolId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaderboardEntries_LeaderboardId",
                table: "LeaderboardEntries",
                column: "LeaderboardId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaderboardEntries_StudentId",
                table: "LeaderboardEntries",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_Leaderboards_DrivingSchoolId",
                table: "Leaderboards",
                column: "DrivingSchoolId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentAchievements_AchievementId",
                table: "StudentAchievements",
                column: "AchievementId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentAchievements_StudentId",
                table: "StudentAchievements",
                column: "StudentId");
        }
    }
}
