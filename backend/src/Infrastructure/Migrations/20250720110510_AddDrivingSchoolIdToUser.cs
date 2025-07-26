using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDrivingSchoolIdToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "DrivingSchoolId",
                table: "Users",
                type: "uuid",
                nullable: true,
                defaultValue: null);

            migrationBuilder.AddColumn<Guid>(
                name: "DrivingSchoolId",
                table: "Quizzes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "DrivingSchoolId",
                table: "Notifications",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "TaxNumber",
                table: "DrivingSchools",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Users_DrivingSchoolId",
                table: "Users",
                column: "DrivingSchoolId");

            migrationBuilder.CreateIndex(
                name: "IX_Quizzes_DrivingSchoolId",
                table: "Quizzes",
                column: "DrivingSchoolId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_DrivingSchoolId",
                table: "Notifications",
                column: "DrivingSchoolId");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_DrivingSchools_DrivingSchoolId",
                table: "Notifications",
                column: "DrivingSchoolId",
                principalTable: "DrivingSchools",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Quizzes_DrivingSchools_DrivingSchoolId",
                table: "Quizzes",
                column: "DrivingSchoolId",
                principalTable: "DrivingSchools",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_DrivingSchools_DrivingSchoolId",
                table: "Users",
                column: "DrivingSchoolId",
                principalTable: "DrivingSchools",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_DrivingSchools_DrivingSchoolId",
                table: "Notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_Quizzes_DrivingSchools_DrivingSchoolId",
                table: "Quizzes");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_DrivingSchools_DrivingSchoolId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_DrivingSchoolId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Quizzes_DrivingSchoolId",
                table: "Quizzes");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_DrivingSchoolId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "DrivingSchoolId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DrivingSchoolId",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "DrivingSchoolId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "TaxNumber",
                table: "DrivingSchools");
        }
    }
}
