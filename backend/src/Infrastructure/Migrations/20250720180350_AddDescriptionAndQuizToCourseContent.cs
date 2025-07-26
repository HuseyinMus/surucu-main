using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDescriptionAndQuizToCourseContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "CourseContents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "QuizId",
                table: "CourseContents",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CourseContents_QuizId",
                table: "CourseContents",
                column: "QuizId");

            migrationBuilder.AddForeignKey(
                name: "FK_CourseContents_Quizzes_QuizId",
                table: "CourseContents",
                column: "QuizId",
                principalTable: "Quizzes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseContents_Quizzes_QuizId",
                table: "CourseContents");

            migrationBuilder.DropIndex(
                name: "IX_CourseContents_QuizId",
                table: "CourseContents");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "CourseContents");

            migrationBuilder.DropColumn(
                name: "QuizId",
                table: "CourseContents");
        }
    }
}
