using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuildingMaterials.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixInvoiceCreatedByRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Employees_CreatedById",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_CreatedById",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "Invoices");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_CreatedByEmployeeId",
                table: "Invoices",
                column: "CreatedByEmployeeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Employees_CreatedByEmployeeId",
                table: "Invoices",
                column: "CreatedByEmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Employees_CreatedByEmployeeId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_CreatedByEmployeeId",
                table: "Invoices");

            migrationBuilder.AddColumn<int>(
                name: "CreatedById",
                table: "Invoices",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_CreatedById",
                table: "Invoices",
                column: "CreatedById");

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Employees_CreatedById",
                table: "Invoices",
                column: "CreatedById",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
