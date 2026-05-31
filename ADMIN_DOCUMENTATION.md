# توثيق نظام المدير (Admin/Manager) - نظام Red Board ERP

## نظرة عامة

نظام إدارة الموارد المؤسسية (ERP) لشركة ريد بورد لمواد البناء. يحتوي النظام على ثلاث لوحات تحكم رئيسية:
- **المالك (Owner)** - صلاحية كاملة على كل شيء
- **المحاسب (Accountant)** - صلاحيات مالية وإدارية
- **موظف الفرع (Staff)** - صلاحيات تشغيلية محدودة

---

## 1. صلاحيات الأدوار الإدارية

### المالك (Owner) - `EmployeeRole.Owner = 1`
- لوحة تحكم شاملة بمؤشرات الأداء (KPIs)
- إدارة المخزون الكامل (إضافة/تعديل/حذف منتجات)
- عرض جميع فواتير المبيعات عبر الفروع
- إدارة الموظفين (إضافة/تعديل/حذف، رواتب، تغيير كلمة السر)
- التقارير الشاملة (7 تبويبات)
- إدارة الفروع (إضافة/تعديل، تعيين فرع إداري)
- إدارة المنتجات (كتالوج المنتجات)
- إدارة العملاء والديون
- إدارة الموردين والمشتريات

### المحاسب (Accountant) - `EmployeeRole.Accountant = 2`
- لوحة تحكم مبسطة (قيمة المخزون، ديون العملاء، المستحق للموردين)
- إدارة الموردين ودفعاتهم
- إضافة فواتير مشتريات (تحديث المخزون تلقائياً)
- إدارة حسابات العملاء (الديون الآجلة)
- عرض المخزون الكامل (قراءة فقط)
- تقارير مالية (أرباح/خسائر، يومي، آجل، منتجات)

---

## 2. هيكل المسارات (Routes)

### مسارات المالك (`/owner/*`)
```
/owner/dashboard       ← لوحة تحكم المالك
/owner/inventory       ← المخزون الكامل
/owner/sales           ← المبيعات والأرباح
/owner/employees       ← الموظفون والرواتب
/owner/reports         ← التقارير الشاملة
/owner/branches        ← إدارة الفروع
/owner/products        ← إدارة المنتجات
/owner/customers       ← العملاء والديون
/owner/suppliers       ← الموردون
```

### مسارات المحاسب (`/accountant/*`)
```
/accountant/dashboard     ← لوحة تحكم المحاسب
/accountant/suppliers     ← إدارة الموردين
/accountant/purchases     ← إضافة مشتريات
/accountant/clients       ← حسابات العملاء
/accountant/inventory     ← المخزون الكامل
/accountant/reports       ← التقارير المالية
```

### حماية المسارات (Route Guards)
```jsx
// في router.jsx
// المالك فقط:
<ProtectedRoute allowedRoles={['owner']} />

// المالك والمحاسب:
<ProtectedRoute allowedRoles={['accountant', 'owner']} />

// الكل (بما فيهم موظف الفرع):
<ProtectedRoute allowedRoles={['staff', 'accountant', 'owner']} />
```

---

## 3. الصفحات - المالك (Owner)

### 3.1 OwnerDashboard.jsx (291 سطر)
**لوحة تحكم المالك** - الرف المسار: `/owner/dashboard`

**المكونات:**
- هيدر مع أزرار فلترة (اليوم / هذا الشهر / هذه السنة / مخصص)
- شريط KPI: إجمالي الفروع، إجمالي الإيرادات، إجمالي الأرباح، أفضل فرع
- 6 بطاقات إحصائيات: قيمة المخزون الكلي، ديون العملاء، المستحق للموردين، عدد الفواتير، صافي الإيرادات، صافي الأرباح
- رسم بياني: الاتجاه الشهري للإيرادات والأرباح (RevenueChart)
- رسم بياني: مقارنة الفروع (BarChart)
- جدول: تفاصيل أداء الفروع مع ترتيب وشارات (ذهبي/فضي/برونزي)

**API المستخدم:** `api.getOwnerDashboardStats(from, to)`

**مصدر البيانات (Backend - ReportService.GetOwnerDashboardStatsAsync):**
- `totalInventoryValue`: مجموع (الكمية × متوسط التكلفة) من BranchInventories
- `totalDeferredFromClients`: مجموع TotalDeferred من Clients
- `totalDueToSuppliers`: مجموع TotalDue من Suppliers
- `monthlyRevenue`: صافي الإيرادات (إيرادات - مرتجعات) في الفترة
- `monthlyProfit`: صافي الربح (صافي الإيرادات - COGS)
- `monthlyData`: آخر 6 أشهر (شهر، إيراد، ربح)
- `branchComparison`: مقارنة بين الفروع غير الإدارية

---

### 3.2 OwnerInventory.jsx (237 سطر)
**المخزون الكامل** - الرف المسار: `/owner/inventory`

**الميزات:**
- عرض جميع المنتجات مع مخزون كل فرع (StockTable)
- إضافة منتج جديد (مودال)
- تعديل منتج موجود
- إدارة كميات وتكاليف كل فرع عند الإضافة/التعديل

**نموذج إضافة/تعديل المنتج:**
- اسم المنتج *
- باركود
- التصنيف *
- الوحدة (قطعة/كيلو/متر/لتر/كرتونة/شيكارة/طقم) *
- سعر البيع الحالي *
- أقل سعر بيع *
- سعر الشراء
- الحد الأدنى للمخزون
- كميات وتكاليف الفروع (لكل فرع: كمية، تكلفة الوحدة)

**API:**
- `GET /Product` - getProducts
- `GET /Product/categories` - getCategories
- `GET /Branch` - getBranches
- `POST /Product` - addProduct
- `PUT /Product/:id` - updateProduct

---

### 3.3 OwnerSales.jsx (302 سطر)
**المبيعات والأرباح** - الرف المسار: `/owner/sales`

**الميزات:**
- عرض جميع فواتير الفروع مع فلترة متقدمة
- شريط KPI: إجمالي المبيعات، فواتير البيع، فواتير المرتجع، إجمالي الفواتير
- فلترة حسب: التاريخ (من/إلى)، النوع (بيع نقدي/آجل/مرتجع)، الفرع، طريقة الدفع، بحث نصي
- عرض تفصيلي للفاتورة (مودال)

**أنواع الفواتير:** بيع نقدي، بيع آجل، مرتجع مبيعات، مرتجع آجل

**API:**
- `GET /Invoice` - getInvoices
- `GET /Invoice/:id` - getInvoiceById
- `GET /Report/dashboard` - getOwnerDashboardStats (لإحصائيات شريط KPI)
- `GET /Branch` - getBranches

---

### 3.4 OwnerEmployees.jsx (244 سطر)
**الموظفون والرواتب** - الرف المسار: `/owner/employees`

**الميزات:**
- جدول بعرض جميع الموظفين
- إضافة موظف جديد (مودال)
- صرف راتب موظف (مودال)
- تغيير كلمة المرور
- تفعيل/تعطيل موظف
- حذف موظف

**نموذج إضافة موظف:**
- الاسم *
- رقم الهاتف *
- كلمة المرور *
- الدور (موظف/محاسب/المدير)
- الفرع
- الراتب
- الرقم القومي
- تاريخ التعيين

**نموذج صرف الراتب:**
- الشهر (تلقائي)
- الراتب (قابل للتعديل)
- تأكيد الصرف

**API:**
- `GET /Employee` - getEmployees
- `GET /Employee/salary-payments` - getSalaryPayments
- `GET /Branch` - getBranches
- `POST /Employee` - addEmployee
- `POST /Employee/pay-salary` - paySalary
- `PUT /Employee/reset-password` - resetEmployeePassword
- `PUT /Employee/:id/toggle-active` - toggleEmployeeActive
- `DELETE /Employee/:id` - deleteEmployee

---

### 3.5 OwnerReports.jsx (~2500 سطر)
**التقارير الشاملة** - الرف المسار: `/owner/reports`

**7 تبويبات:**

#### (أ) الأرباح والخسائر (PnL)
- فلترة: فترة (اليوم/الشهر/السنة/مخصص)، الفرع
- بطاقات: إجمالي الإيرادات، المرتجعات، صافي الإيرادات، COGS، إجمالي الربح، هامش الربح، عدد الفواتير، متوسط الفاتورة
- رسوم بيانية: RevenueChart, PnlMiniChart
- جدول: تفاصيل الحركة الشهرية
- **API:** `GET /Report/pnl?dateFrom=&dateTo=&branchId=`

#### (ب) التقرير اليومي
- فلترة: التاريخ
- شريط KPI: إجمالي المبيعات، إجمالي المرتجعات، صافي الإيرادات
- رسوم بيانية: PaymentPieChart (توزيع طرق الدفع)، BranchRevenueDonut (مساهمة الفروع)
- رسم BarChart: أداء الفروع اليومي حسب طريقة التحصيل
- جدول: تفاصيل الفروع (نقدي، فيزا، شيك، آجل بيع، آجل محصّل، مرتجعات، صافي، فواتير)
- تصدير CSV
- **API:** `GET /Report/daily-all?date=`

#### (ج) مقارنة الفروع
- فلترة: فترة
- شريط KPI: أعلى فرع إيراداً، أعلى فرع ربحاً، إجمالي الإيرادات، إجمالي الأرباح
- رسم بياني: BranchComparison
- جدول: تفاصيل المقارنة (ترتيب، إيراد، مرتجعات، صافي، COGS، ربح، هامش%)
- تصدير CSV
- **API:** `GET /Report/branch-comparison?dateFrom=&dateTo=`

#### (د) المنتجات
- فلترة: فترة، الفرع، ترتيب حسب (الإيراد/الكمية/الربح)، عدد النتائج (10/20/50/الكل)
- رسوم بيانية: TopProductsChart (بالإيراد والربح والكمية)
- جدول: تفاصيل المنتجات (المنتج، باركود، كمية مباعة، إيراد، تكلفة، ربح، هامش%)
- قسم المخزون الحالي: جدول بكميات كل فرع والإجمالي وحالة المخزون (منخفض/جيد)
- **API:** `GET /Report/top-products?`, `GET /Report/inventory-value`

#### (هـ) الآجل والعملاء
- فلترة: فترة للتحصيلات
- شريط KPI: إجمالي الديون، عدد العملاء بديون، أعلى عميل ديناً
- لوحة تقييم المخاطر الائتمانية (عالية/متوسطة/منخفضة)
- رسوم بيانية: AgingStackChart، BarChart لتوزيع أعمار الديون
- جدول: تحليل الأعمار (Aging Analysis) - اسم العميل، إجمالي الدين، حد ائتماني، % استخدام، 0-30 يوم، 31-60، 61-90، +90، أقدم فاتورة
- رسم CollectionsChart وقسم سجل التحصيل (جدول)
- **API:** `GET /Report/deferred-aging`, `GET /Report/deferred-collections`

#### (و) الرواتب
- فلترة: الشهر، السنة، الفرع
- شريط KPI: إجمالي الرواتب، إجمالي السلف، عدد الموظفين
- رسوم بيانية: SalaryChart
- جدول: تفاصيل الرواتب
- تصدير CSV
- **API:** `GET /Report/salary-summary-detailed?month=&year=&branchId=`

#### (ز) دفتر الأستاذ والمالية (Ledger)
- فلترة: فترة، الفرع، بحث نصي
- شريط KPI: إجمالي الوارد، إجمالي الصادر، صافي الحركة
- رسم بياني: LedgerFlowChart
- جدول: التاريخ، البيان، الفرع، النوع، وارد، صادر، الرصيد التراكمي
- **API:** `GET /Report/ledger?dateFrom=&dateTo=&branchId=`

**مصادر بيانات دفتر الأستاذ:**
1. فواتير البيع (وارد)
2. فواتير البيع الآجل (وارد)
3. فواتير المرتجع (صادر)
4. تحصيلات العملاء (وارد)
5. فواتير المشتريات (صادر - الجزء المدفوع)
6. دفعات الموردين (صادر)
7. مصروفات الفروع (صادر)
8. الرواتب (صادر)

---

### 3.6 OwnerBranches.jsx (116 سطر)
**إدارة الفروع** - الرف المسار: `/owner/branches`

**الميزات:**
- عرض جميع الفروع (بطاقات)
- إضافة فرع جديد (مودال)
- بحث باسم الفرع أو الموقع
- شارات: إداري (Admin) / فرع بيع (Sales Branch)
- حالة النشاط: نشط / غير نشط

**نموذج إضافة فرع:**
- اسم الفرع *
- الموقع
- رقم الهاتف
- checkbox: فرع إداري (isAdminBranch)

**API:** `GET /Branch`, `POST /Branch`

---

### 3.7 OwnerProducts.jsx (150 سطر)
**إدارة المنتجات** - الرف المسار: `/owner/products`

**الميزات:**
- جدول بعرض جميع المنتجات
- إضافة منتج جديد (مودال)
- بحث باسم المنتج أو الباركود

**الجدول:** الاسم، باركود، التصنيف، الوحدة، سعر الشراء، أقل سعر بيع، سعر البيع، الحد الأدنى

**نموذج إضافة منتج:**
- اسم المنتج *، باركود، الوحدة *، التصنيف *
- سعر الشراء *، أقل سعر بيع *، سعر البيع الحالي *
- الحد الأدنى للمخزون

**API:** `GET /Product`, `GET /Product/categories`, `POST /Product`

---

### 3.8 OwnerCustomers.jsx (346 سطر)
**العملاء والديون** - الرف المسار: `/owner/customers`

**الميزات:**
- بطاقات إحصائيات: إجمالي الديون، عدد العملاء، عملاء تجاوزوا 80% من الحد الائتماني، فواتير آجلة
- تنبيهات للعملاء المتجاوزين للحد الائتماني
- جدول العملاء: الاسم، الهاتف، النوع (شركة/فرد)، إجمالي الديون، الحد الائتماني، نسبة الاستخدام، الإجراءات
- كشف حساب (مودال)
- تحصيل دفعات (مودال)
- إضافة عميل جديد (مودال)
- عرض فواتير العميل الآجلة عند التحديد

**API:** `GET /Client`, `GET /Invoice?type=sale_deferred`, `POST /Client`, `POST /Client/payment`, `GET /Client/:id/statement`

---

### 3.9 OwnerSuppliers.jsx (349 سطر)
**الموردون** - الرف المسار: `/owner/suppliers`

**الميزات:**
- بطاقات إحصائيات: إجمالي المديونية، إجمالي المدفوع، عدد الموردين، فواتير شراء مفتوحة
- جدول الموردين: الاسم، الهاتف، العنوان، إجمالي المشتريات، المدفوع، المستحق، الإجراءات
- كشف حساب مورد (مودال)
- دفع مبلغ لمورد (مودال) - دفع للفاتورة أو دفع مستقل
- إضافة مورد جديد (مودال)
- عرض فواتير المشتريات للمورد عند التحديد

**API:** `GET /Supplier`, `GET /Purchase`, `POST /Supplier`, `POST /Purchase/payment`, `POST /Supplier/payment`, `GET /Supplier/:id/statement`

---

## 4. الصفحات - المحاسب (Accountant)

### 4.1 AccountantDashboard.jsx (82 سطر)
**لوحة تحكم المحاسب** - الرف المسار: `/accountant/dashboard`

- 4 بطاقات إحصائيات: قيمة المخزون الكلي، ديون العملاء، المستحق للموردين، عدد الفواتير
- جدول: حسابات الموردين مع بحث

**API:** `GET /Supplier`, `GET /Report/dashboard`

---

### 4.2 AccountantSuppliers.jsx (170 سطر)
**إدارة الموردين** - الرف المسار: `/accountant/suppliers`

- جدول الموردين مع بحث
- عرض فواتير الشراء للمورد المحدد
- دفع فاتورة شراء (مودال)

---

### 4.3 AccountantPurchases.jsx (196 سطر)
**إضافة مشتريات للمخزون** - الرف المسار: `/accountant/purchases`

**الميزات:**
- اختيار المورد والفرع المستلم
- إضافة منتجات (جدول ديناميكي: منتج، كمية، سعر شراء، الإجمالي)
- إضافة/إزالة بنود
- سعر النقل
- اسم المشروع (اختياري)
- المدفوع الآن + طريقة الدفع
- ملاحظات
- **API:** `POST /Purchase` (تحديث المخزون تلقائياً)

---

### 4.4 AccountantClients.jsx (245 سطر)
**حسابات العملاء** - الرف المسار: `/accountant/clients`

- 3 بطاقات: إجمالي الديون، إجمالي الحد الائتماني، عملاء تجاوزوا 80%
- تنبيهات للعملاء المتجاوزين
- جدول العملاء مع مؤشر الاستخدام الائتماني
- عرض فواتير العميل الآجلة عند التحديد
- استلام دفعة (مودال)

---

### 4.5 AccountantInventory.jsx (34 سطر)
**المخزون الكامل** (قراءة فقط)

---

### 4.6 AccountantReports.jsx (374 سطر)
**التقارير المالية**

- 4 تبويبات: الأرباح والخسائر، التقرير اليومي، الآجل والعملاء، المنتجات
- نسخة مبسطة من تقارير المالك

---

## 5. Backend - الإدارة

### 5.1 ReportController.cs (224 سطر)
**نقطة نهاية التقارير** - `[Route("api/[controller]")]`

| API | الصلاحية | الوصف |
|-----|----------|-------|
| `GET /dashboard` | Owner, Accountant | إحصائيات لوحة التحكم |
| `GET /pnl` | Owner, Accountant | تقرير الأرباح والخسائر |
| `GET /daily-all` | Owner, Accountant | التقرير اليومي لكل الفروع |
| `GET /branch-comparison` | Owner, Accountant | مقارنة الفروع |
| `GET /top-products` | Owner, Accountant | أعلى المنتجات مبيعاً |
| `GET /inventory-value` | Owner, Accountant | قيمة المخزون |
| `GET /deferred-aging` | Owner, Accountant | تحليل أعمار الديون |
| `GET /deferred-collections` | Owner, Accountant | سجل تحصيل الآجل |
| `GET /ledger` | Owner, Accountant, Staff | دفتر الأستاذ |
| `GET /revenue-by-payment` | Owner فقط | الإيرادات حسب طريقة الدفع |
| `GET /branch/:id/monthly` | Owner فقط | التقرير الشهري لفرع |
| `GET /products/top` | Owner فقط | أعلى المنتجات (قديم) |
| `GET /salary-summary` | Owner فقط | ملخص الرواتب |
| `GET /salary-summary-detailed` | Owner فقط | تفاصيل الرواتب |
| `GET /invoices/export` | Owner, Accountant | تصدير الفواتير Excel |
| `GET /invoices/export-pdf` | Owner, Accountant | تصدير الفواتير PDF |

### 5.2 EmployeeController.cs
| API | الوصف |
|-----|-------|
| `GET /Employee` | قائمة الموظفين |
| `POST /Employee` | إضافة موظف |
| `DELETE /Employee/:id` | حذف موظف |
| `PUT /Employee/:id/toggle-active` | تفعيل/تعطيل |
| `POST /Employee/pay-salary` | صرف راتب |
| `GET /Employee/salary-payments` | سجل صرف الرواتب |
| `PUT /Employee/reset-password` | تغيير كلمة المرور |

### 5.3 BranchController.cs
| API | الوصف |
|-----|-------|
| `GET /Branch` | قائمة الفروع |
| `GET /Branch/:id` | تفاصيل فرع |
| `POST /Branch` | إضافة فرع |

### 5.4 ProductController.cs
| API | الوصف |
|-----|-------|
| `GET /Product` | قائمة المنتجات |
| `GET /Product/categories` | قائمة التصنيفات |
| `POST /Product` | إضافة منتج (مع كميات أولية للفروع) |
| `PUT /Product/:id` | تحديث منتج |
| `DELETE /Product/:id` | حذف منتج |

### 5.5 InventoryController.cs
| API | الوصف |
|-----|-------|
| `GET /Inventory/stock` | المخزون الكامل |
| `GET /Inventory/branch/:id` | مخزون فرع |
| `GET /Inventory/low-stock` | المنتجات منخفضة المخزون |

---

## 6. مفاهيم أساسية في النظام

### الفرع الإداري (Admin Branch)
- `Branch.IsAdminBranch = true`
- الفروق: `B004 - الإدارة المركزية / Central Administration`
- لا يظهر في قوائم اختيار الفروع (`branches.filter(b => !b.isAdminBranch)`)
- لا يدخل في مقارنات الفروع أو التقارير

### نظام الصلاحيات (Permissions System)
```javascript
// AuthContext.jsx
owner:    { canViewAllBranches, canManageSuppliers, canViewSalaries, canCreateInvoices, canManageEmployees }
accountant: canViewAllBranches, canManageSuppliers, canViewSalaries (true),
            canCreateInvoices, canManageEmployees (false)
staff:    { canViewAllBranches: true, canCreateInvoices: true, others: false }
```

### JWT Authentication
- تسجيل الدخول: `POST /api/Auth/login` (هاتف + كلمة مرور)
- تجديد التوكن: `POST /api/Auth/refresh` 
- معلومات المستخدم: `GET /api/Auth/me`
- تغيير كلمة المرور: `POST /api/Auth/change-password`
- تسجيل الخروج: `POST /api/Auth/logout`
- التوكن مخزن في HttpOnly Cookies، مع Refresh Token

---

## 7. DTOs الرئيسية (Backend)

### OwnerDashboardStatsDto
```
TotalInventoryValue, TotalDeferredFromClients, TotalDueToSuppliers,
TotalInvoicesCount, MonthlyRevenue, MonthlyProfit,
MonthlyData[] (Month, Revenue, Profit),
BranchComparison[] (BranchName, BranchId, Revenue, Profit, InvoicesCount)
```

### PnLReportDto
```
DateFrom, DateTo, TotalRevenue, TotalReturns, NetRevenue,
COGS, GrossProfit, GrossProfitMargin, InvoicesCount,
AverageInvoiceValue, MonthlyData[] (Month, Revenue, Profit)
```

### LedgerResponseDto
```
TotalIn, TotalOut, NetAmount,
Entries[] (Date, Description, BranchName, Type, PaymentMethod,
           InAmount, OutAmount, ReferenceNumber)
```

### DeferredAgingReportDto
```
TotalDeferred, ClientsWithDebt,
Clients[] (ClientId, ClientName, TotalDebt, CreditLimit,
           CreditUsagePercent, Days0to30, Days31to60, Days61to90, DaysOver90,
           OldestInvoiceDate)
```

---

## 8. ملاحظات فنية

- **الواجهة الأمامية:** React 19 + Vite 8 + React Router 7 + Bootstrap 5 + Recharts 3
- **الخلفية:** .NET 8 + Entity Framework Core 8 + AutoMapper + FluentValidation
- **قاعدة البيانات:** SQL Server
- **التوثيق:** JWT (HttpOnly Cookies)
- **اللغات:** كل واجهات المستخدم بالعربية (RTL)
- **تنسيق الأرقام:** جنيه مصري (ج.م) مع فاصل آلاف ومنزلتين عشريتين

---

*آخر تحديث: يوليو 2025*
