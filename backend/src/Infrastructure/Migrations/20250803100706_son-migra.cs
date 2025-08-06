using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class sonmigra : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudentProgresses_Students_StudentId1",
                table: "StudentProgresses");

            migrationBuilder.DropIndex(
                name: "IX_StudentProgresses_StudentId1",
                table: "StudentProgresses");

            migrationBuilder.DropColumn(
                name: "StudentId1",
                table: "StudentProgresses");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "StudentId1",
                table: "StudentProgresses",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentProgresses_StudentId1",
                table: "StudentProgresses",
                column: "StudentId1");

            migrationBuilder.AddForeignKey(
                name: "FK_StudentProgresses_Students_StudentId1",
                table: "StudentProgresses",
                column: "StudentId1",
                principalTable: "Students",
                principalColumn: "Id");
        }
    }
}
