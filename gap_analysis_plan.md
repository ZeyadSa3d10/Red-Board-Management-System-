# خطة الفجوات — مقارنة البروتوتايب بالمشروع الفعلي

> الهدف: تحديد كل اللوجيك والسيناريوهات الناقصة فقط (بدون تصميم)

---

## أولاً: Backend — اللوجيك الناقص

### 1. العملاء (ClientService / ClientController)
**الموجود:** GetAll, GetById, Create, Update, GetWithDeferred  
**الناقص:**
- `POST /api/client/{id}/payment` — تسجيل دفعة من عميل لتقليص رصيده الآجل
  - السيناريو: العميل يدفع جزء أو كل دينه، يُحدَّث `Client.TotalDeferred` وينشأ سجل `ClientPayment`
- `GET /api/client/{id}/statement` — كشف حساب العميل (فواتيره الآجلة + دفعاته)
- **تحقق الحد**: عند إنشاء فاتورة آجلة، التحقق إن `TotalDeferred + invoiceAmount <= CreditLimit` ورفض العملية لو تجاوز

---

### 2. الموردون (SupplierService / SupplierController)
**الموجود:** GetAll, GetById, Create, Update — الدفع فقط يتم داخل PurchaseService  
**الناقص:**
- `POST /api/supplier/{id}/payment` — دفعة مستقلة للمورد (تسديد دين قديم بدون شراء جديد)
  - يُحدَّث `Supplier.TotalPaid` و `Supplier.TotalDue`، وينشأ `SupplierPayment`
- `GET /api/supplier/{id}/statement` — كشف حساب المورد (فواتير الشراء + دفعاته)

---

### 3. أوامر الشراء (PurchaseService / PurchaseController)
**الموجود:** AddPurchaseInvoice, GetBySupplierIdAsync  
**الناقص:**
- `GET /api/purchase` — جلب كل أوامر الشراء (مش مقيدة بمورد معين) مع فلترة بالتاريخ/الفرع
- `POST /api/purchase/{id}/payment` — دفع جزئي على فاتورة شراء موجودة (تقليل `RemainingAmount`)
- `GET /api/purchase/{id}` — تفاصيل فاتورة شراء واحدة مع أصنافها

---

### 4. المشاريع (ProjectService / ProjectController)
**الموجود:** Create, Update, AddClientPayment, AddContractorPayment, CompleteProject  
**الناقص:**
- `POST /api/project/{id}/suspend` — تعليق المشروع (status = Suspended)
  - البروتوتايب يعرض "متوقف" كحالة ثالثة لكن السيرفر عنده Complete فقط
- `POST /api/project/{id}/reactivate` — إعادة تفعيل مشروع معلق
- `GET /api/project/{id}/payments` — جلب كل دفعات المشروع (عميل + مقاول) في قائمة واحدة للتقرير
- **تحقق الدفعات**: التحقق أن دفعة المقاول لا تتجاوز `ContractorContractValue` (موجود) وكذلك دفعة العميل

---

### 5. المقاولون (ContractorController)
**الموجود:** GetAll, GetById, Create, Update, GetContractorProjects  
**الناقص:**
- `GET /api/contractor/{id}/payments` — كل الدفعات التي دُفعت للمقاول عبر كل مشاريعه
  - البروتوتايب يعرض "سجل الدفعات" في صفحة تفاصيل المقاول

---

### 6. الموظفون / الرواتب (EmployeeService)
**الموجود:** PaySalary (يُسجَّل المبلغ كما هو)  
**الناقص:**
- `POST /api/employee/{id}/advance` — تسجيل سلفة للموظف
  - البروتوتايب عنده عمود "سُلف" في جدول الرواتب — لكن لا يوجد كيان ولا endpoint لها
- `GET /api/employee/{id}/salary-history` — سجل رواتب موظف واحد عبر الشهور
- **حساب العمالة اليومية**: موظف `SalaryType=Daily` راتبه = الأساسي × أيام العمل — الـ service حالياً يُسجّل ما يُدخله اليوزر فقط بدون منطق الحساب
- `GET /api/employee/salary-pending` — قائمة الموظفين اللي لم يُصرف لهم راتب الشهر الحالي

---

### 7. الفواتير (InvoiceService / InvoiceController)
**الموجود:** Create Sale/Deferred/Return/ProjectIssue, GetInvoices, GetById, GetDailyRevenue  
**الناقص:**
- `PUT /api/invoice/{id}/cancel` — إلغاء فاتورة (status = Cancelled)
  - البروتوتايب يعرض status "ملغاة" لكن لا يوجد endpoint لذلك
  - عند الإلغاء: إرجاع الكمية للمخزون، وإن كانت آجلة تُخفَّض ديون العميل
- `GET /api/invoice/{id}/print` — بيانات الفاتورة بصيغة قابلة للطباعة
- **الـ DailyRevenue للمالك**: الـ endpoint الحالي يقبل `branchId` واحد فقط — المالك محتاج `GET /api/invoice/daily-revenue/all?date=` يرجع كل الفروع

---

### 8. المخزون (InventoryService / InventoryController)
**الموجود:** GetAll, GetByBranch, GetLowStock  
**الناقص:**
- `GET /api/inventory/matrix` — جدول pivot (منتج × فرع) يعرض كمية كل منتج في كل فرع
  - البروتوتايب يعرض هذا بالضبط في صفحة المخزون
- `GET /api/inventory/low-stock/count` — عدد المنتجات المنخفضة (للـ dashboard stat)

---

### 9. التقارير (ReportService / ReportController)
**الموجود:** GetOwnerDashboardStats (revenue, profit, COGS, branch comparison, project summary)  
**الناقص:**
- `GET /api/report/revenue-by-payment` — توزيع الإيراد (نقدي / فيزا / آجل محصّل) لفترة معينة
  - البروتوتايب يعرض هذا في صفحة التقارير
- `GET /api/report/branch/{id}/monthly` — تقرير شهري لفرع واحد
- `GET /api/report/products/top` — أعلى المنتجات ربحاً (Revenue - COGS per product)
- `GET /api/report/salary-summary` — ملخص الرواتب المدفوعة لفترة معينة
- **AccountantDashboard**: لا يوجد endpoint مخصص للمحاسب — حالياً يستخدم نفس الـ Owner dashboard

---

## ثانياً: Frontend — الصفحات والسيناريوهات الناقصة

### Owner Role

| الصفحة | الحالة | الناقص |
|--------|--------|--------|
| `OwnerDashboard` | ✅ موجود مع date filtering | **إيراد كل الفروع ليوم محدد** (AllBranches daily) |
| `OwnerSales` | ⚠️ موجود | لا يوجد **إنشاء فاتورة جديدة** من صفحة المالك |
| `OwnerInventory` | ✅ موجود | **Matrix view** (منتج × فرع) ناقص |
| `OwnerProducts` | ❌ **مش موجود** | صفحة كاملة لإدارة المنتجات (CRUD + سعر شراء/بيع/حد أدنى) |
| `OwnerCustomers` | ❌ **مش موجود** | قائمة العملاء مع الحد الآجل + alert عند ≥80% + تسجيل دفعة |
| `OwnerContractors` | ⚠️ موجود | **سجل دفعات المقاول** عبر المشاريع ناقص في التفاصيل |
| `OwnerReports` | ⚠️ موجود (صغير جداً) | توزيع الإيراد، أعلى المنتجات، مقارنة الفروع التفصيلية |
| `OwnerEmployees` | ✅ موجود | **سُلف الموظفين** + حساب راتب العمالة اليومية |

---

### Accountant Role

| الصفحة | الحالة | الناقص |
|--------|--------|--------|
| `AccountantDashboard` | ⚠️ موجود (2.8KB) | يحتاج ملخص مالي: إجمالي آجل + مستحقات موردين + مشاريع نشطة |
| `AccountantClients` | ✅ موجود | **تسجيل دفعة من عميل** (collect deferred) |
| `AccountantSuppliers` | ⚠️ موجود | **دفعة مستقلة للمورد** (بدون شراء جديد) |
| `AccountantPurchases` | ⚠️ موجود | **دفع جزئي** على شراء موجود، list all purchases |
| `AccountantInventory` | ❌ **مش موجود** | البروتوتايب يديه المحاسب صفحة المخزون |
| `AccountantReports` | ❌ **مش موجود** | البروتوتايب يديه المحاسب صفحة التقارير |

---

### Branch Staff Role

| الصفحة | الحالة | الناقص |
|--------|--------|--------|
| `BranchInvoices` | ⚠️ موجود | **إنشاء فاتورة** — هل يتضمن نموذج إنشاء كامل؟ (البروتوتايب عنده "فاتورة جديدة" كـ nav item منفصل) |
| `BranchInventory` | ❌ **941 bytes** = stub فارغ تقريباً | عرض مخزون الفرع الحالي مع تحذيرات الحد الأدنى |
| `BranchDailyRevenue` | ✅ موجود | ـ |
| `BranchDeferred` | ✅ موجود | **تسجيل دفعة** من عميل لتحصيل الآجل |
| `BranchTransfers` | ✅ موجود | ـ |

---

## ثالثاً: السيناريوهات (Business Logic) الغائبة كلياً

### 1. سيناريو: تحصيل آجل من عميل
- الموظف يفتح صفحة العملاء → يضغط "تسجيل دفعة"
- يُدخل المبلغ + طريقة الدفع
- النظام يُنشئ `ClientPayment`، يُحدِّث `DeferredInvoice.RemainingAmount`، يُحدِّث `Client.TotalDeferred`
- ينعكس في إيراد اليوم ضمن خانة "آجل محصّل"

### 2. سيناريو: إلغاء فاتورة
- يُغيَّر status الفاتورة إلى Cancelled
- تُعاد الكميات للمخزون (WAC لا يتغير عند الإلغاء — فقط الكمية)
- لو آجلة: يُخفَّض `Client.TotalDeferred`

### 3. سيناريو: تعليق/إعادة تفعيل مشروع
- Owner/Accountant يغير status المشروع من Active → Suspended أو العكس
- لا يوجد تأثير مالي مباشر — فقط تغيير الحالة

### 4. سيناريو: سُلفة موظف
- Owner يُسجل سلفة للموظف بمبلغ وتاريخ
- عند صرف الراتب: `NetSalary = Base + Bonus - Deductions - Advances`
- السلفة تُخصم تلقائياً من أول راتب بعدها

### 5. سيناريو: دفعة جزئية لمورد
- Accountant يفتح صفحة المورد → يضغط "دفع"
- يُدخل مبلغ + طريقة الدفع
- النظام يُنشئ `SupplierPayment` مستقل (بدون PurchaseInvoice)
- يُحدَّث `Supplier.TotalPaid` و `Supplier.TotalDue`

### 6. سيناريو: مخزون منخفض → إنذار
- عند كل بيع: بعد تقليل الكمية، التحقق `Quantity < Product.MinStockAlert`
- إذا صح: إنشاء notification أو إضافة للـ dashboard alerts
- حالياً: الـ GetLowStock يعمل لكن لا يُستدعى بعد كل فاتورة

### 7. سيناريو: تقرير يومي متكامل للمالك
- المالك يختار تاريخ → يرى جدول: فرع × (نقدي / فيزا / آجل بيع / آجل محصّل / مرتجعات / صافي)
- حالياً: `/daily-revenue?branchId=X&date=Y` يقبل فرع واحد فقط

---

## ترتيب الأولويات (ابدأ بإيه)

| الأولوية | الموضوع | السبب |
|----------|---------|-------|
| 🔴 1 | تسجيل تحصيل آجل من عميل | Core workflow يومي |
| 🔴 2 | إلغاء فاتورة | ضروري جداً في العمليات |
| 🔴 3 | BranchInventory (الصفحة الفارغة) | الفرع عمياء على مخزونه |
| 🔴 4 | OwnerProducts صفحة كاملة | لا توجد إدارة منتجات من الـ Owner |
| 🟠 5 | دفعة مستقلة للمورد | يُؤثر على الحسابات |
| 🟠 6 | GET /api/purchase كل الفواتير | Accountant لا يرى كل المشتريات |
| 🟠 7 | تعليق المشروع (Suspend) | حالة مذكورة في الـ prototype |
| 🟠 8 | سلفة الموظف | يُؤثر على حساب الراتب |
| 🟡 9 | AccountantInventory + AccountantReports | صفحات ناقصة |
| 🟡 10 | OwnerCustomers صفحة | معظمها في AccountantClients |
| 🟡 11 | Daily Revenue لكل الفروع (owner) | تحسين الـ dashboard |
| 🟡 12 | Inventory Matrix endpoint | تحسين عرض المخزون |
