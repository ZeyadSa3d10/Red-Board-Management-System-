using AutoMapper;
using BuildingMaterials.Application.DTOs.Auth;
using BuildingMaterials.Application.DTOs.Branch;
using BuildingMaterials.Application.DTOs.Product;
using BuildingMaterials.Application.DTOs.Invoice;
using BuildingMaterials.Application.DTOs.Client;
using BuildingMaterials.Application.DTOs.Supplier;
using BuildingMaterials.Application.DTOs.Employee;
using BuildingMaterials.Application.DTOs.Expense;
using BuildingMaterials.Application.DTOs.Inventory;
using BuildingMaterials.Application.DTOs.Purchase;
using BuildingMaterials.Application.DTOs.Report;
using BuildingMaterials.Application.Services.Interfaces;
using BuildingMaterials.Domain.Entities;
using BuildingMaterials.Domain.Enums;

namespace BuildingMaterials.Application.Mappings;

public class AutoMapperProfile : Profile
{
    public AutoMapperProfile()
    {
        CreateMap<Branch, BranchDto>();
        CreateMap<CreateBranchDto, Branch>();

        CreateMap<Product, ProductDto>()
            .ForMember(d => d.CategoryName, o => o.MapFrom(s => s.Category.Name));
        CreateMap<CreateProductDto, Product>()
            .ForMember(d => d.BranchInventories, o => o.Ignore());

        CreateMap<Employee, EmployeeDto>()
            .ForMember(d => d.Role, o => o.MapFrom(s => s.Role.ToString()))
            .ForMember(d => d.BranchName, o => o.MapFrom(s => s.Branch != null ? s.Branch.Name : null));
        CreateMap<Employee, OwnerEmployeeDto>()
            .ForMember(d => d.Role, o => o.MapFrom(s => s.Role.ToString()))
            .ForMember(d => d.BranchName, o => o.MapFrom(s => s.Branch != null ? s.Branch.Name : null));

        CreateMap<Client, ClientDto>();
        CreateMap<CreateClientDto, Client>();

        CreateMap<Supplier, SupplierDto>()
            .ForMember(d => d.CategoryName, o => o.MapFrom(s => s.Category != null ? s.Category.Name : null));
        CreateMap<CreateSupplierDto, Supplier>();

        CreateMap<Invoice, InvoiceResponseDto>()
            .ForMember(d => d.Type, o => o.MapFrom(s => s.Type.ToString()))
            .ForMember(d => d.BranchName, o => o.MapFrom(s => s.Branch != null ? s.Branch.Name : null))
            .ForMember(d => d.ClientName, o => o.MapFrom(s => s.WalkInClientName ?? (s.Client != null ? s.Client.Name : null)))
            .ForMember(d => d.PaymentMethod, o => o.MapFrom(s => s.PaymentMethod.HasValue ? s.PaymentMethod.Value.ToString() : null))
            .ForMember(d => d.CreatedBy, o => o.MapFrom(s => s.CreatedBy != null ? s.CreatedBy.FullName : null))
            .ForMember(d => d.PaidAmount, o => o.MapFrom(s => s.DeferredInvoice != null ? s.DeferredInvoice.PaidAmount : 0))
            .ForMember(d => d.RemainingAmount, o => o.MapFrom(s => s.DeferredInvoice != null ? s.DeferredInvoice.RemainingAmount : (s.Type == InvoiceType.SaleDeferred ? s.TotalAmount : 0)))
            .ForMember(d => d.DueDate, o => o.MapFrom(s =>
                s.DeferredInvoice != null
                    ? s.DeferredInvoice.DueDate
                    : s.Type == InvoiceType.ReturnDeferred && s.RelatedInvoice != null && s.RelatedInvoice.DeferredInvoice != null
                        ? s.RelatedInvoice.DeferredInvoice.DueDate
                        : s.DeferredDueDate))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.DeferredInvoice != null ? s.DeferredInvoice.Status.ToString() : (s.Type == InvoiceType.SaleDeferred ? "Unpaid" : null)));

        CreateMap<Invoice, InvoiceListDto>()
            .ForMember(d => d.Type, o => o.MapFrom(s => s.Type.ToString()))
            .ForMember(d => d.BranchName, o => o.MapFrom(s => s.Branch != null ? s.Branch.Name : null))
            .ForMember(d => d.ClientName, o => o.MapFrom(s => s.WalkInClientName ?? (s.Client != null ? s.Client.Name : null)))
            .ForMember(d => d.PaymentMethod, o => o.MapFrom(s => s.PaymentMethod.HasValue ? s.PaymentMethod.Value.ToString() : null))
            .ForMember(d => d.OriginalPaymentMethod, o => o.MapFrom(s =>
                s.RelatedInvoice != null && s.RelatedInvoice.PaymentMethod.HasValue
                    ? s.RelatedInvoice.PaymentMethod.Value.ToString()
                    : null))
            .ForMember(d => d.CreatedBy, o => o.MapFrom(s => s.CreatedBy != null ? s.CreatedBy.FullName : null))
            .ForMember(d => d.PaidAmount, o => o.MapFrom(s => s.DeferredInvoice != null ? s.DeferredInvoice.PaidAmount : 0))
            .ForMember(d => d.RemainingAmount, o => o.MapFrom(s => s.DeferredInvoice != null ? s.DeferredInvoice.RemainingAmount : (s.Type == InvoiceType.SaleDeferred ? s.TotalAmount : 0)))
            .ForMember(d => d.DueDate, o => o.MapFrom(s =>
                s.DeferredInvoice != null
                    ? s.DeferredInvoice.DueDate
                    : s.Type == InvoiceType.ReturnDeferred && s.RelatedInvoice != null && s.RelatedInvoice.DeferredInvoice != null
                        ? s.RelatedInvoice.DeferredInvoice.DueDate
                        : s.DeferredDueDate))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.DeferredInvoice != null ? s.DeferredInvoice.Status.ToString() : (s.Type == InvoiceType.SaleDeferred ? "Unpaid" : null)))
            .ForMember(d => d.DeferredInvoiceId, o => o.MapFrom(s => s.DeferredInvoice != null ? (int?)s.DeferredInvoice.Id : null));

        CreateMap<InvoiceItem, InvoiceItemResponseDto>()
            .ForMember(d => d.ProductName, o => o.MapFrom(s => s.Product != null ? s.Product.Name : null));

        CreateMap<BranchInventory, InventoryDto>()
            .ForMember(d => d.ProductName, o => o.MapFrom(s => s.Product.Name))
            .ForMember(d => d.Barcode, o => o.MapFrom(s => s.Product.Barcode))
            .ForMember(d => d.BranchName, o => o.MapFrom(s => s.Branch.Name));

        CreateMap<PurchaseInvoice, PurchaseInvoiceResponseDto>()
            .ForMember(d => d.SupplierName, o => o.MapFrom(s => s.Supplier != null ? s.Supplier.Name : null))
            .ForMember(d => d.BranchName, o => o.MapFrom(s => s.Branch != null ? s.Branch.Name : null))
            .ForMember(d => d.AddedByName, o => o.MapFrom(s => s.AddedBy != null ? s.AddedBy.FullName : null))
            .ForMember(d => d.PaymentMethod, o => o.MapFrom(s => s.Payments.FirstOrDefault() != null ? s.Payments.First().PaymentMethod.ToString() : null));
        CreateMap<PurchaseInvoiceItem, PurchaseItemResponseDto>()
            .ForMember(d => d.ProductName, o => o.MapFrom(s => s.Product != null ? s.Product.Name : null));

        CreateMap<SalaryAdvance, SalaryAdvanceResponseDto>()
            .ForMember(d => d.EmployeeName, o => o.MapFrom(s => s.Employee.FullName));

        CreateMap<InventoryTransfer, TransferDto>()
            .ForMember(d => d.SourceBranchName, o => o.MapFrom(s => s.SourceBranch != null ? s.SourceBranch.Name : "N/A"))
            .ForMember(d => d.DestinationBranchName, o => o.MapFrom(s => s.DestinationBranch != null ? s.DestinationBranch.Name : "N/A"))
            .ForMember(d => d.CreatedBy, o => o.MapFrom(s => s.CreatedBy != null ? s.CreatedBy.FullName : "N/A"))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()));

        CreateMap<InventoryTransferItem, TransferItemResponseDto>()
            .ForMember(d => d.ProductName, o => o.MapFrom(s => s.Product != null ? s.Product.Name : "N/A"));

        CreateMap<BranchExpense, ExpenseResponseDto>()
            .ForMember(d => d.BranchName, o => o.MapFrom(s => s.Branch != null ? s.Branch.Name : null))
            .ForMember(d => d.CreatedBy, o => o.MapFrom(s => s.CreatedBy != null ? s.CreatedBy.FullName : null));
    }
}
