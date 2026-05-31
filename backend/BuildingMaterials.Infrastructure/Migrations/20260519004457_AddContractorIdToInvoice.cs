using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuildingMaterials.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddContractorIdToInvoice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ContractorId",
                table: "Invoices",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_ContractorId",
                table: "Invoices",
                column: "ContractorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Contractors_ContractorId",
                table: "Invoices",
                column: "ContractorId",
                principalTable: "Contractors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Contractors_ContractorId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_ContractorId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ContractorId",
                table: "Invoices");
        }
    }
}
