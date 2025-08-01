using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLessonTypeColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Schedules_Courses_CourseId",
                table: "Schedules");

            migrationBuilder.RenameColumn(
                name: "Type",
                table: "Schedules",
                newName: "LessonType");

            migrationBuilder.RenameColumn(
                name: "CourseId",
                table: "Schedules",
                newName: "DrivingSchoolId");

            migrationBuilder.RenameIndex(
                name: "IX_Schedules_CourseId",
                table: "Schedules",
                newName: "IX_Schedules_DrivingSchoolId");

            migrationBuilder.AddColumn<Guid>(
                name: "StudentId1",
                table: "StudentProgresses",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Schedules",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "Duration",
                table: "Schedules",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Schedules",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentProgresses_StudentId1",
                table: "StudentProgresses",
                column: "StudentId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Schedules_DrivingSchools_DrivingSchoolId",
                table: "Schedules",
                column: "DrivingSchoolId",
                principalTable: "DrivingSchools",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_StudentProgresses_Students_StudentId1",
                table: "StudentProgresses",
                column: "StudentId1",
                principalTable: "Students",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Schedules_DrivingSchools_DrivingSchoolId",
                table: "Schedules");

            migrationBuilder.DropForeignKey(
                name: "FK_StudentProgresses_Students_StudentId1",
                table: "StudentProgresses");

            migrationBuilder.DropIndex(
                name: "IX_StudentProgresses_StudentId1",
                table: "StudentProgresses");

            migrationBuilder.DropColumn(
                name: "StudentId1",
                table: "StudentProgresses");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Schedules");

            migrationBuilder.DropColumn(
                name: "Duration",
                table: "Schedules");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Schedules");

            migrationBuilder.RenameColumn(
                name: "LessonType",
                table: "Schedules",
                newName: "Type");

            migrationBuilder.RenameColumn(
                name: "DrivingSchoolId",
                table: "Schedules",
                newName: "CourseId");

            migrationBuilder.RenameIndex(
                name: "IX_Schedules_DrivingSchoolId",
                table: "Schedules",
                newName: "IX_Schedules_CourseId");

            migrationBuilder.AddForeignKey(
                name: "FK_Schedules_Courses_CourseId",
                table: "Schedules",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
