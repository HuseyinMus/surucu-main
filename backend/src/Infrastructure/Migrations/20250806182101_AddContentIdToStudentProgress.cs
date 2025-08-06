using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddContentIdToStudentProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudentProgresses_CourseContents_CourseContentId",
                table: "StudentProgresses");

            migrationBuilder.RenameColumn(
                name: "CourseContentId",
                table: "StudentProgresses",
                newName: "CourseId");

            migrationBuilder.RenameIndex(
                name: "IX_StudentProgresses_CourseContentId",
                table: "StudentProgresses",
                newName: "IX_StudentProgresses_CourseId");

            migrationBuilder.AlterColumn<int>(
                name: "Attempts",
                table: "StudentProgresses",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<Guid>(
                name: "ContentId",
                table: "StudentProgresses",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "StudentProgresses",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<DateTime>(
                name: "SentAt",
                table: "Notifications",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AddColumn<string>(
                name: "AutomationRule",
                table: "Notifications",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "ClickRate",
                table: "Notifications",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "ClickedCount",
                table: "Notifications",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Notifications",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "ErrorMessage",
                table: "Notifications",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FailedRecipients",
                table: "Notifications",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsAutomated",
                table: "Notifications",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSentAt",
                table: "Notifications",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxSendAttempts",
                table: "Notifications",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Metadata",
                table: "Notifications",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "OpenRate",
                table: "Notifications",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "OpenedCount",
                table: "Notifications",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Priority",
                table: "Notifications",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "RecipientIds",
                table: "Notifications",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecipientType",
                table: "Notifications",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "RecurrenceDays",
                table: "Notifications",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RecurrenceEndDate",
                table: "Notifications",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceInterval",
                table: "Notifications",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceType",
                table: "Notifications",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ScheduleType",
                table: "Notifications",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledDate",
                table: "Notifications",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SendAttempts",
                table: "Notifications",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SentToRecipients",
                table: "Notifications",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Tags",
                table: "Notifications",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TemplateId",
                table: "Notifications",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalRecipients",
                table: "Notifications",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TriggerCondition",
                table: "Notifications",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "NotificationRecipient",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NotificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeliveredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    OpenedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ClickedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationRecipient", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NotificationRecipient_Notifications_NotificationId",
                        column: x => x.NotificationId,
                        principalTable: "Notifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NotificationRecipient_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NotificationTemplate",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DrivingSchoolId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    TitleTemplate = table.Column<string>(type: "text", nullable: false),
                    MessageTemplate = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    Variables = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    NotificationId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationTemplate", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NotificationTemplate_DrivingSchools_DrivingSchoolId",
                        column: x => x.DrivingSchoolId,
                        principalTable: "DrivingSchools",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NotificationTemplate_Notifications_NotificationId",
                        column: x => x.NotificationId,
                        principalTable: "Notifications",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_StudentProgresses_ContentId",
                table: "StudentProgresses",
                column: "ContentId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationRecipient_NotificationId",
                table: "NotificationRecipient",
                column: "NotificationId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationRecipient_UserId",
                table: "NotificationRecipient",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationTemplate_DrivingSchoolId",
                table: "NotificationTemplate",
                column: "DrivingSchoolId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationTemplate_NotificationId",
                table: "NotificationTemplate",
                column: "NotificationId");

            migrationBuilder.AddForeignKey(
                name: "FK_StudentProgresses_CourseContents_ContentId",
                table: "StudentProgresses",
                column: "ContentId",
                principalTable: "CourseContents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_StudentProgresses_Courses_CourseId",
                table: "StudentProgresses",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudentProgresses_CourseContents_ContentId",
                table: "StudentProgresses");

            migrationBuilder.DropForeignKey(
                name: "FK_StudentProgresses_Courses_CourseId",
                table: "StudentProgresses");

            migrationBuilder.DropTable(
                name: "NotificationRecipient");

            migrationBuilder.DropTable(
                name: "NotificationTemplate");

            migrationBuilder.DropIndex(
                name: "IX_StudentProgresses_ContentId",
                table: "StudentProgresses");

            migrationBuilder.DropColumn(
                name: "ContentId",
                table: "StudentProgresses");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "StudentProgresses");

            migrationBuilder.DropColumn(
                name: "AutomationRule",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "ClickRate",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "ClickedCount",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "ErrorMessage",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "FailedRecipients",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "IsAutomated",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "LastSentAt",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "MaxSendAttempts",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "Metadata",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "OpenRate",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "OpenedCount",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "RecipientIds",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "RecipientType",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "RecurrenceDays",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "RecurrenceEndDate",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "RecurrenceInterval",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "RecurrenceType",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "ScheduleType",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "ScheduledDate",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "SendAttempts",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "SentToRecipients",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "Tags",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "TemplateId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "TotalRecipients",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "TriggerCondition",
                table: "Notifications");

            migrationBuilder.RenameColumn(
                name: "CourseId",
                table: "StudentProgresses",
                newName: "CourseContentId");

            migrationBuilder.RenameIndex(
                name: "IX_StudentProgresses_CourseId",
                table: "StudentProgresses",
                newName: "IX_StudentProgresses_CourseContentId");

            migrationBuilder.AlterColumn<int>(
                name: "Attempts",
                table: "StudentProgresses",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "SentAt",
                table: "Notifications",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_StudentProgresses_CourseContents_CourseContentId",
                table: "StudentProgresses",
                column: "CourseContentId",
                principalTable: "CourseContents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
