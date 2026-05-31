using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuildingMaterials.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTransportCostAndBranchExpense : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProjectName",
                table: "PurchaseInvoices",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TransportCost",
                table: "PurchaseInvoices",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "PaymentReference",
                table: "Invoices",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReturnReason",
                table: "Invoices",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TransportCost",
                table: "Invoices",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "BranchExpenses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BranchId = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    ExpenseDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedByEmployeeId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BranchExpenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BranchExpenses_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BranchExpenses_Employees_CreatedByEmployeeId",
                        column: x => x.CreatedByEmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_EmployeeId",
                table: "AuditLogs",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_BranchExpenses_BranchId",
                table: "BranchExpenses",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_BranchExpenses_CreatedByEmployeeId",
                table: "BranchExpenses",
                column: "CreatedByEmployeeId");

            migrationBuilder.AddForeignKey(
                name: "FK_AuditLogs_Employees_EmployeeId",
                table: "AuditLogs",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AuditLogs_Employees_EmployeeId",
                table: "AuditLogs");

            migrationBuilder.DropTable(
                name: "BranchExpenses");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_EmployeeId",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "ProjectName",
                table: "PurchaseInvoices");

            migrationBuilder.DropColumn(
                name: "TransportCost",
                table: "PurchaseInvoices");

            migrationBuilder.DropColumn(
                name: "PaymentReference",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ReturnReason",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "TransportCost",
                table: "Invoices");
        }
    }
}
