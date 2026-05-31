using BuildingMaterials.Domain.Entities;
using BuildingMaterials.Domain.Enums;
using BuildingMaterials.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterials.Infrastructure.Seed;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        if (await context.Branches.AnyAsync()) return;

        var now = DateTime.UtcNow;
        var rng = new Random(42);

        // ========== BRANCHES ==========
        var branches = new List<Branch>
        {
            new() { Name = "فرع الإسكندرية", Location = "الإسكندرية، المنطقة الصناعية", Phone = "03-4567890" },
            new() { Name = "فرع القاهرة",    Location = "القاهرة، مدينة نصر",          Phone = "02-2345678" },
            new() { Name = "فرع الجيزة",     Location = "الجيزة، الهرم",               Phone = "02-3456789" },
            new() { Name = "الإدارة المركزية", Location = "القاهرة",                   Phone = "02-1234567", IsAdminBranch = true }
        };
        context.Branches.AddRange(branches);
        await context.SaveChangesAsync();

        // ========== EMPLOYEES ==========
        var empPwd = (string plain) => BCrypt.Net.BCrypt.HashPassword(plain);

        var employees = new List<Employee>
        {
            new() { FullName = "المهندس رامي السيد",       Phone = "01123456789", PasswordHash = empPwd("Admin@1234"), Role = EmployeeRole.Owner,         NationalId = "12345678901234", Salary = null,    JoinDate = now.AddMonths(-24), IsActive = true },
            new() { FullName = "سعيد إبراهيم ناصر",        Phone = "01101234567", PasswordHash = empPwd("Acc@1234"),  Role = EmployeeRole.Accountant,    NationalId = "23456789012345", Salary = 7000,    JoinDate = now.AddMonths(-18), IsActive = true, BranchId = branches[3].Id },
            new() { FullName = "أحمد عبدالله السيد",       Phone = "01211111111", PasswordHash = empPwd("BM@1234"),   Role = EmployeeRole.Staff, NationalId = "34567890123456", Salary = 6000,    JoinDate = now.AddMonths(-12), IsActive = true, BranchId = branches[0].Id },
            new() { FullName = "محمد حسن علي",             Phone = "01222222222", PasswordHash = empPwd("BM@1234"),   Role = EmployeeRole.Staff, NationalId = "45678901234567", Salary = 6000,    JoinDate = now.AddMonths(-12), IsActive = true, BranchId = branches[1].Id },
            new() { FullName = "خالد محمود فتحي",          Phone = "01233333333", PasswordHash = empPwd("BM@1234"),   Role = EmployeeRole.Staff, NationalId = "56789012345678", Salary = 6000,    JoinDate = now.AddMonths(-10), IsActive = true, BranchId = branches[2].Id },
            new() { FullName = "مصطفى كامل رجب",           Phone = "01244444444", PasswordHash = empPwd("Staff@1234"), Role = EmployeeRole.Staff, NationalId = "67890123456789", Salary = 3500,    JoinDate = now.AddMonths(-6),  IsActive = true, BranchId = branches[0].Id },
            new() { FullName = "كريم أحمد محمود",          Phone = "01255555555", PasswordHash = empPwd("Staff@1234"), Role = EmployeeRole.Staff, NationalId = "78901234567890", Salary = 3500,    JoinDate = now.AddMonths(-6),  IsActive = true, BranchId = branches[1].Id },
            new() { FullName = "أيمن شريف عبدالرحمن",      Phone = "01266666666", PasswordHash = empPwd("Staff@1234"), Role = EmployeeRole.Staff, NationalId = "89012345678901", Salary = 3500,    JoinDate = now.AddMonths(-4),  IsActive = true, BranchId = branches[2].Id },
            new() { FullName = "ناصر جمال الدين",          Phone = "01277777777", PasswordHash = empPwd("Staff@1234"), Role = EmployeeRole.Staff, NationalId = "90123456789012", Salary = 3500,    JoinDate = now.AddMonths(-3),  IsActive = true, BranchId = branches[0].Id },
            new() { FullName = "فارس يوسف عادل",           Phone = "01288888888", PasswordHash = empPwd("Staff@1234"), Role = EmployeeRole.Staff, NationalId = "01234567890123", Salary = 3500,    JoinDate = now.AddMonths(-2),  IsActive = true, BranchId = branches[1].Id },
        };
        context.Employees.AddRange(employees);
        await context.SaveChangesAsync();

        var owner = employees[0];
        var accountant = employees[1];
        var alexMgr = employees[2];
        var cairoMgr = employees[3];
        var gizaMgr = employees[4];
        var alexStaff = employees[5];
        var cairoStaff = employees[6];
        var gizaStaff = employees[7];

        // ========== CATEGORIES ==========
        var categories = new List<Category>
        {
            new() { Name = "طوب وبلوك" },
            new() { Name = "أسمنت وملاط" },
            new() { Name = "حديد تسليح" },
            new() { Name = "سيراميك وبلاط" },
            new() { Name = "دهانات" },
            new() { Name = "أدوات صحية" }
        };
        context.Categories.AddRange(categories);
        await context.SaveChangesAsync();

        // ========== PRODUCTS ==========
        var products = new List<Product>
        {
            // طوب وبلوك
            new() { Name = "طوب أحمر 6×12×25",               CategoryId = categories[0].Id, Barcode = "1001", Unit = "ألف طوبة",  PurchasePrice = 850,   MinSalePrice = 950,   CurrentSalePrice = 1050,  MinStockAlert = 50  },
            new() { Name = "طوب أسمنتي مفرغ 4×12×25",        CategoryId = categories[0].Id, Barcode = "1002", Unit = "ألف طوبة",  PurchasePrice = 1100,  MinSalePrice = 1250,  CurrentSalePrice = 1400,  MinStockAlert = 30  },
            new() { Name = "بلوك خفيف 20×20×40",              CategoryId = categories[0].Id, Barcode = "1003", Unit = "متر مكعب",  PurchasePrice = 1800,  MinSalePrice = 2000,  CurrentSalePrice = 2200,  MinStockAlert = 20  },
            // أسمنت وملاط
            new() { Name = "أسمنت بورتلاند 42.5",             CategoryId = categories[1].Id, Barcode = "2001", Unit = "طن",        PurchasePrice = 1800,  MinSalePrice = 1950,  CurrentSalePrice = 2100,  MinStockAlert = 20  },
            new() { Name = "أسمنت مقاوم 42.5 R",              CategoryId = categories[1].Id, Barcode = "2002", Unit = "طن",        PurchasePrice = 1950,  MinSalePrice = 2100,  CurrentSalePrice = 2300,  MinStockAlert = 15  },
            new() { Name = "جير حي",                          CategoryId = categories[1].Id, Barcode = "2003", Unit = "طن",        PurchasePrice = 600,   MinSalePrice = 750,   CurrentSalePrice = 850,   MinStockAlert = 10  },
            new() { Name = "ملاط لياسة جاهز",                 CategoryId = categories[1].Id, Barcode = "2004", Unit = "كيس 50 كجم", PurchasePrice = 45,    MinSalePrice = 55,    CurrentSalePrice = 65,    MinStockAlert = 100 },
            // حديد تسليح
            new() { Name = "حديد 10 مم تسليح",                CategoryId = categories[2].Id, Barcode = "3001", Unit = "طن",        PurchasePrice = 15000, MinSalePrice = 15800, CurrentSalePrice = 16500, MinStockAlert = 10  },
            new() { Name = "حديد 12 مم تسليح",                CategoryId = categories[2].Id, Barcode = "3002", Unit = "طن",        PurchasePrice = 14800, MinSalePrice = 15600, CurrentSalePrice = 16300, MinStockAlert = 10  },
            new() { Name = "حديد 16 مم تسليح",                CategoryId = categories[2].Id, Barcode = "3003", Unit = "طن",        PurchasePrice = 14600, MinSalePrice = 15400, CurrentSalePrice = 16100, MinStockAlert = 10  },
            new() { Name = "حديد 8 مم أملس",                 CategoryId = categories[2].Id, Barcode = "3004", Unit = "طن",        PurchasePrice = 15200, MinSalePrice = 16000, CurrentSalePrice = 16800, MinStockAlert = 8   },
            // سيراميك وبلاط
            new() { Name = "سيراميك 60×60 بيج",               CategoryId = categories[3].Id, Barcode = "4001", Unit = "متر مربع",  PurchasePrice = 85,    MinSalePrice = 100,   CurrentSalePrice = 120,   MinStockAlert = 100 },
            new() { Name = "سيراميك 40×40 أبيض",              CategoryId = categories[3].Id, Barcode = "4002", Unit = "متر مربع",  PurchasePrice = 65,    MinSalePrice = 78,    CurrentSalePrice = 95,    MinStockAlert = 100 },
            new() { Name = "بورسلين 80×80 رمادي",             CategoryId = categories[3].Id, Barcode = "4003", Unit = "متر مربع",  PurchasePrice = 140,   MinSalePrice = 160,   CurrentSalePrice = 185,   MinStockAlert = 50  },
            new() { Name = "بلاط حوائط 25×40 موزايكو",        CategoryId = categories[3].Id, Barcode = "4004", Unit = "متر مربع",  PurchasePrice = 55,    MinSalePrice = 68,    CurrentSalePrice = 80,    MinStockAlert = 80  },
            // دهانات
            new() { Name = "دهان بلاستيك أبيض 10 لتر",        CategoryId = categories[4].Id, Barcode = "5001", Unit = "جركن",      PurchasePrice = 180,   MinSalePrice = 210,   CurrentSalePrice = 250,   MinStockAlert = 30  },
            new() { Name = "دهان زيتي لامع 5 لتر",            CategoryId = categories[4].Id, Barcode = "5002", Unit = "جركن",      PurchasePrice = 250,   MinSalePrice = 290,   CurrentSalePrice = 340,   MinStockAlert = 20  },
            new() { Name = "معجون جدران 25 كجم",              CategoryId = categories[4].Id, Barcode = "5003", Unit = "كيس",        PurchasePrice = 70,    MinSalePrice = 85,    CurrentSalePrice = 100,   MinStockAlert = 40  },
            new() { Name = "سيلر أكريليك 10 لتر",             CategoryId = categories[4].Id, Barcode = "5004", Unit = "جركن",      PurchasePrice = 140,   MinSalePrice = 165,   CurrentSalePrice = 195,   MinStockAlert = 15  },
            // أدوات صحية
            new() { Name = "خلاط حوض مطبخ كروم",              CategoryId = categories[5].Id, Barcode = "6001", Unit = "قطعة",      PurchasePrice = 350,   MinSalePrice = 420,   CurrentSalePrice = 500,   MinStockAlert = 10  },
            new() { Name = "خلاط حوض حمام كروم",              CategoryId = categories[5].Id, Barcode = "6002", Unit = "قطعة",      PurchasePrice = 280,   MinSalePrice = 340,   CurrentSalePrice = 400,   MinStockAlert = 10  },
            new() { Name = "طقم سخان 50 لتر",                 CategoryId = categories[5].Id, Barcode = "6003", Unit = "قطعة",      PurchasePrice = 1200,  MinSalePrice = 1400,  CurrentSalePrice = 1650,  MinStockAlert = 5   },
            new() { Name = "مرحاض عادي + طقم كاملة",          CategoryId = categories[5].Id, Barcode = "6004", Unit = "طقم",       PurchasePrice = 650,   MinSalePrice = 780,   CurrentSalePrice = 920,   MinStockAlert = 5   },
        };
        context.Products.AddRange(products);
        await context.SaveChangesAsync();

        // ========== BRANCH INVENTORY ==========
        var inventory = new List<BranchInventory>();
        foreach (var product in products)
        {
            foreach (var branch in branches.Take(3))
            {
                var qty = rng.Next(5, 200);
                var avgCost = (product.PurchasePrice ?? 0) * (1 + (decimal)(rng.NextDouble() * 0.08));
                inventory.Add(new BranchInventory
                {
                    ProductId = product.Id,
                    BranchId = branch.Id,
                    Quantity = qty,
                    AverageCost = Math.Round(avgCost, 2)
                });
            }
        }
        context.BranchInventories.AddRange(inventory);
        await context.SaveChangesAsync();

        // ========== CLIENTS ==========
        var clients = new List<Client>
        {
            new() { Name = "شركة النيل للمقاولات",    Phone = "01011111111", Address = "القاهرة - المعادي",             IsCompany = true,  CreditLimit = 200000 },
            new() { Name = "مكتبة الإسكندرية للبناء", Phone = "01022222222", Address = "الإسكندرية - سموحة",           IsCompany = true,  CreditLimit = 150000 },
            new() { Name = "الحاج عبدالفتاح محمود",    Phone = "01033333333", Address = "الجيزة - الهرم",               IsCompany = false, CreditLimit = 30000 },
            new() { Name = "الأستاذ أحمد حسن",        Phone = "01044444444", Address = "القاهرة - مدينة نصر",          IsCompany = false, CreditLimit = 20000 },
            new() { Name = "مهندس محمد كمال",         Phone = "01055555555", Address = "الإسكندرية - محطة الرمل",      IsCompany = false, CreditLimit = 15000 },
        };
        context.Clients.AddRange(clients);
        await context.SaveChangesAsync();

        // ========== SUPPLIERS ==========
        var suppliers = new List<Supplier>
        {
            new() { Name = "شركة الحديد والصلب",        Phone = "0234567890", Address = "حلوان - القاهرة",              CategoryId = categories[2].Id },
            new() { Name = "مصنع الإسكندرية للأسمنت",   Phone = "0345678901", Address = "الإسكندرية - الكيلو 21",      CategoryId = categories[1].Id },
            new() { Name = "شركة سيراميكا كليوباترا",   Phone = "0245678901", Address = "العاشر من رمضان",              CategoryId = categories[3].Id },
            new() { Name = "شركة الطوب الأحمر المصري",  Phone = "0256789012", Address = "القليوبية - شبرا الخيمة",     CategoryId = categories[0].Id },
            new() { Name = "مؤسسة الدهانات الحديثة",    Phone = "0367890123", Address = "الإسكندرية - برج العرب",       CategoryId = categories[4].Id },
            new() { Name = "وكيل الأدوات الصحية",       Phone = "0278901234", Address = "القاهرة - رمسيس",             CategoryId = categories[5].Id },
        };
        context.Suppliers.AddRange(suppliers);
        await context.SaveChangesAsync();

        // ========== PURCHASE INVOICES ==========
        var purchaseInvoices = new List<PurchaseInvoice>();
        var purchaseItemsList = new List<PurchaseInvoiceItem>();
        var supplierPaymentsList = new List<SupplierPayment>();

        int pinvCounter = 0;
        foreach (var supplier in suppliers)
        {
            for (int i = 0; i < 2; i++)
            {
                var invoiceDate = now.AddMonths(-(6 - i * 3));
                var filteredProducts = products.Where(p => p.CategoryId == (supplier.CategoryId ?? 1)).Take(3).ToList();
                if (!filteredProducts.Any()) filteredProducts = products.Take(2).ToList();

                decimal totalAmount = 0;
                var items = new List<(Product Product, decimal Qty, decimal UnitCost, decimal TotalCost)>();
                foreach (var prod in filteredProducts)
                {
                    var qty = rng.Next(10, 50);
                    var unitCost = (prod.PurchasePrice ?? 0) - rng.Next(0, 100);
                    var totalCost = qty * unitCost;
                    totalAmount += totalCost;
                    items.Add((prod, qty, Math.Round(unitCost, 2), Math.Round(totalCost, 2)));
                }

                var paidAmount = i == 0 ? totalAmount : totalAmount * 0.5m;
                var branchId = branches[rng.Next(0, 3)].Id;

                pinvCounter++;
                var invoice = new PurchaseInvoice
                {
                    InvoiceNumber = $"PINV-{2026000 + pinvCounter}",
                    SupplierId = supplier.Id,
                    BranchId = branchId,
                    TotalAmount = Math.Round(totalAmount, 2),
                    PaidAmount = Math.Round(paidAmount, 2),
                    RemainingAmount = Math.Round(totalAmount - paidAmount, 2),
                    InvoiceDate = invoiceDate,
                    AddedByEmployeeId = accountant.Id,
                    AddedById = accountant.Id,
                    Notes = $"فاتورة مشتريات #{i + 1}"
                };
                context.PurchaseInvoices.Add(invoice);
                await context.SaveChangesAsync();

                foreach (var (prod, qty, unitCost, totalCost) in items)
                {
                    purchaseItemsList.Add(new PurchaseInvoiceItem
                    {
                        PurchaseInvoiceId = invoice.Id,
                        ProductId = prod.Id,
                        Quantity = qty,
                        UnitCost = unitCost,
                        TotalCost = totalCost
                    });
                }

                if (paidAmount > 0)
                {
                    supplierPaymentsList.Add(new SupplierPayment
                    {
                        SupplierId = supplier.Id,
                        PurchaseInvoiceId = invoice.Id,
                        Amount = Math.Round(paidAmount, 2),
                        PaymentMethod = i == 0 ? PaymentMethod.BankTransfer : PaymentMethod.Check,
                        PaymentDate = invoiceDate.AddDays(rng.Next(1, 7)),
                        CheckNumber = i == 0 ? null : $"CHK-S{pinvCounter}",
                        PaidByEmployeeId = accountant.Id,
                        PaidById = accountant.Id,
                        Notes = i == 0 ? "كاش" : "شيك"
                    });
                }
            }
        }
        context.PurchaseInvoiceItems.AddRange(purchaseItemsList);
        context.SupplierPayments.AddRange(supplierPaymentsList);
        await context.SaveChangesAsync();

        // ========== SALE INVOICES ==========
        var invoices = new List<Invoice>();
        var invoiceItemsList = new List<InvoiceItem>();

        for (int i = 0; i < 8; i++)
        {
            var branchIdx = i % 3;
            var branch = branches[branchIdx];
            var client = clients[i % clients.Count];
            var invoiceDate = now.AddMonths(-(8 - i)).AddDays(rng.Next(1, 15));

            var pickedProducts = products.OrderBy(_ => rng.Next()).Take(rng.Next(2, 5)).ToList();
            decimal subtotal = 0;
            var items = new List<(Product Product, decimal Qty, decimal UnitPrice, decimal TotalPrice, decimal Cost)>();
            foreach (var prod in pickedProducts)
            {
                var qty = rng.Next(1, 20);
                var unitPrice = prod.CurrentSalePrice;
                var totalPrice = qty * unitPrice;
                subtotal += totalPrice;
                items.Add((prod, qty, Math.Round(unitPrice, 2), Math.Round(totalPrice, 2), Math.Round((prod.PurchasePrice ?? 0) * (1 + (decimal)(rng.NextDouble() * 0.05)), 2)));
            }

            var discount = subtotal > 5000 ? Math.Round(subtotal * 0.05m, 2) : 0;
            var createdBy = i % 2 == 0
                ? (branchIdx == 0 ? alexStaff.Id : branchIdx == 1 ? cairoStaff.Id : gizaStaff.Id)
                : (branchIdx == 0 ? alexMgr.Id : branchIdx == 1 ? cairoMgr.Id : gizaMgr.Id);

            var invoice = new Invoice
            {
                InvoiceNumber = $"INV-{2026100 + i + 1}",
                Type = i < 6 ? InvoiceType.Sale : InvoiceType.SaleDeferred,
                BranchId = branch.Id,
                ClientId = client.Id,
                Subtotal = Math.Round(subtotal, 2),
                Discount = discount,
                TotalAmount = Math.Round(subtotal - discount, 2),
                PaymentMethod = i < 6 ? PaymentMethod.Cash : PaymentMethod.Check,
                DeferredDueDate = i >= 6 ? invoiceDate.AddMonths(3) : null,
                CreatedAt = invoiceDate,
                CreatedByEmployeeId = createdBy,
                Notes = $"فاتورة بيع #{i + 1}"
            };
            context.Invoices.Add(invoice);
            invoices.Add(invoice);
            await context.SaveChangesAsync();

            foreach (var (prod, qty, unitPrice, totalPrice, cost) in items)
            {
                invoiceItemsList.Add(new InvoiceItem
                {
                    InvoiceId = invoice.Id,
                    ProductId = prod.Id,
                    Quantity = qty,
                    UnitPrice = unitPrice,
                    TotalPrice = totalPrice,
                    CostAtTime = cost
                });
            }
        }
        context.InvoiceItems.AddRange(invoiceItemsList);
        await context.SaveChangesAsync();

        // ========== TODAY'S INVOICES (for dashboard non-zero revenue) ==========
        var todayInvoices = new List<Invoice>();
        var todayItems = new List<InvoiceItem>();
        var today = DateTime.Today;
        for (int i = 0; i < 3; i++)
        {
            var branch = branches[i];
            var client = clients[i % clients.Count];
            var pickedProducts = products.OrderBy(_ => rng.Next()).Take(rng.Next(2, 4)).ToList();
            decimal subtotal = 0;
            var items = new List<(Product Product, decimal Qty, decimal UnitPrice, decimal TotalPrice, decimal Cost)>();
            foreach (var prod in pickedProducts)
            {
                var qty = rng.Next(1, 10);
                var unitPrice = prod.CurrentSalePrice;
                var totalPrice = qty * unitPrice;
                subtotal += totalPrice;
                items.Add((prod, qty, Math.Round(unitPrice, 2), Math.Round(totalPrice, 2), Math.Round((prod.PurchasePrice ?? 0) * (1 + (decimal)(rng.NextDouble() * 0.05)), 2)));
            }
            var discount = subtotal > 5000 ? Math.Round(subtotal * 0.05m, 2) : 0;
            var createdBy = i == 0 ? alexStaff.Id : i == 1 ? cairoStaff.Id : gizaStaff.Id;
            var invoice = new Invoice
            {
                InvoiceNumber = $"INV-{2026200 + i + 1}",
                Type = InvoiceType.Sale,
                BranchId = branch.Id,
                ClientId = client.Id,
                Subtotal = Math.Round(subtotal, 2),
                Discount = discount,
                TotalAmount = Math.Round(subtotal - discount, 2),
                PaymentMethod = i == 0 ? PaymentMethod.Cash : i == 1 ? PaymentMethod.VodafoneCash : PaymentMethod.Check,
                CreatedAt = today.AddHours(8 + i),
                CreatedByEmployeeId = createdBy,
                Notes = $"فاتورة بيع اليوم #{i + 1}"
            };
            context.Invoices.Add(invoice);
            todayInvoices.Add(invoice);
            await context.SaveChangesAsync();
            foreach (var (prod, qty, unitPrice, totalPrice, cost) in items)
            {
                todayItems.Add(new InvoiceItem
                {
                    InvoiceId = invoice.Id,
                    ProductId = prod.Id,
                    Quantity = qty,
                    UnitPrice = unitPrice,
                    TotalPrice = totalPrice,
                    CostAtTime = cost
                });
            }
        }
        context.InvoiceItems.AddRange(todayItems);
        await context.SaveChangesAsync();

        // ========== DEFERRED INVOICES ==========
        var deferredInvoices = invoices
            .Where(x => x.Type == InvoiceType.SaleDeferred)
            .Select(inv => new DeferredInvoice
            {
                ClientId = inv.ClientId!.Value,
                InvoiceId = inv.Id,
                BranchId = inv.BranchId,
                OriginalAmount = inv.TotalAmount,
                PaidAmount = 0,
                RemainingAmount = inv.TotalAmount,
                DueDate = inv.DeferredDueDate,
                Status = DeferredStatus.Unpaid
            }).ToList();
        context.DeferredInvoices.AddRange(deferredInvoices);
        await context.SaveChangesAsync();

        // Update clients' TotalDeferred to match deferred invoices
        foreach (var client in clients)
        {
            client.TotalDeferred = deferredInvoices
                .Where(di => di.ClientId == client.Id)
                .Sum(di => di.RemainingAmount);
        }
        await context.SaveChangesAsync();

        // ========== SALARY PAYMENTS ==========
        var salaryPayments = new List<SalaryPayment>();
        foreach (var emp in employees.Where(e => e.Salary.HasValue))
        {
            for (int m = 1; m <= 4; m++)
            {
                var payDate = now.AddMonths(-m);
                salaryPayments.Add(new SalaryPayment
                {
                    EmployeeId = emp.Id,
                    Month = payDate.Month,
                    Year = payDate.Year,
                    Amount = emp.Salary!.Value,
                    PaymentMethod = PaymentMethod.BankTransfer,
                    PaidDate = payDate.AddDays(1),
                    PaidByEmployeeId = owner.Id,
                    PaidById = owner.Id,
                    Notes = $"مرتب شهر {payDate.Month}/{payDate.Year}"
                });
            }
        }
        context.SalaryPayments.AddRange(salaryPayments);
        await context.SaveChangesAsync();
    }
}
