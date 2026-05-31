# خطة صفحة التقارير — شاملة 100%

## الوضع الحالي
- `OwnerReports.jsx` = 65 سطر فقط — يعرض stats cards + 3 charts من نفس الـ dashboard endpoint
- لا يوجد فلاتر، لا tabs، لا طباعة، لا تصدير
- الـ DTOs موجودة جاهزة: `RevenueByPaymentDto`, `MonthlyBranchReportDto`, `TopProductDto`, `SalarySummaryDto`
- لكن **endpoints هذه الـ DTOs غير موجودة في ReportController**

---

## هيكل الصفحة — 7 Tabs

```
[ الأرباح والخسائر ] [ التقرير اليومي ] [ مقارنة الفروع ] [ المنتجات ] [ المشاريع ] [ الآجل والعملاء ] [ الرواتب ]
```

كل tab عنده:
1. فلاتر خاصة بيه
2. بيانات تُجلب من endpoint محدد
3. جدول/كروت للعرض
4. زرار طباعة أو تصدير CSV

---

## Tab 1: الأرباح والخسائر (P&L)

### الفلاتر
- فترة زمنية: اليوم / هذا الشهر / هذه السنة / مخصص (من/إلى)
- فرع: كل الفروع / فرع محدد

### البيانات المعروضة
| الحقل | المصدر |
|-------|--------|
| إجمالي الإيرادات (بيع) | `SUM(Invoice.TotalAmount) WHERE Type=Sale` |
| إجمالي المرتجعات | `SUM(Invoice.TotalAmount) WHERE Type=ReturnSale` |
| صافي الإيرادات | إيرادات − مرتجعات |
| تكلفة البضاعة المباعة (COGS) | `SUM(InvoiceItem.Quantity × CostAtTime)` |
| إجمالي الربح | صافي الإيرادات − COGS |
| هامش الربح % | (إجمالي الربح / صافي الإيرادات) × 100 |
| عدد الفواتير | COUNT |
| متوسط قيمة الفاتورة | صافي الإيرادات / عدد الفواتير |

### الرسم البياني
- خط (Line chart): الإيراد + الربح شهرياً لآخر 6 أشهر (موجود جزئياً)

### Backend المطلوب
**موجود:** `GET /api/report/dashboard?dateFrom&dateTo`  
**ناقص — يُضاف لـ ReportController:**
```
GET /api/report/pnl?dateFrom&dateTo&branchId
```
**Response:** `PnLReportDto`
```csharp
public class PnLReportDto {
    public decimal TotalRevenue { get; set; }
    public decimal TotalReturns { get; set; }
    public decimal NetRevenue { get; set; }
    public decimal COGS { get; set; }
    public decimal GrossProfit { get; set; }
    public decimal GrossProfitMargin { get; set; }
    public int InvoicesCount { get; set; }
    public decimal AverageInvoiceValue { get; set; }
    public List<MonthlyRevenueDto> MonthlyData { get; set; }
}
```

---

## Tab 2: التقرير اليومي

### الفلاتر
- تاريخ (default: اليوم)
- عرض: كل الفروع جنب بعض (owner) / فرع واحد (accountant)

### البيانات المعروضة — جدول Matrix
| الفرع | نقدي | فيزا | شيك | آجل بيع | آجل محصّل | مرتجعات | صافي اليوم |
|-------|------|------|-----|---------|-----------|---------|-----------|
| فرع القاهرة | ... | ... | ... | ... | ... | ... | ... |
| فرع الإسكندرية | ... | ... | ... | ... | ... | ... | ... |
| فرع الجيزة | ... | ... | ... | ... | ... | ... | ... |
| **الإجمالي** | ... | ... | ... | ... | ... | ... | **...** |

### Backend المطلوب
**موجود:** `GET /api/invoice/daily-revenue?branchId&date` (فرع واحد فقط)  
**ناقص — يُضاف لـ ReportController:**
```
GET /api/report/daily-all?date
```
**Response:** `List<DailyBranchRevenueDto>`
```csharp
public class DailyBranchRevenueDto {
    public int BranchId { get; set; }
    public string BranchName { get; set; }
    public decimal CashAmount { get; set; }
    public decimal VisaAmount { get; set; }
    public decimal CheckAmount { get; set; }
    public decimal DeferredSales { get; set; }      // فواتير آجلة جديدة
    public decimal DeferredCollected { get; set; }  // دفعات آجل محصّل
    public decimal Returns { get; set; }
    public decimal NetRevenue { get; set; }
    public int InvoicesCount { get; set; }
}
```
**السيناريو في Service:**
```csharp
// لكل فرع:
var saleInvoices = invoices WHERE BranchId=b.Id AND Date=date AND Type=Sale
var returnInvoices = invoices WHERE BranchId=b.Id AND Date=date AND Type=ReturnSale
var deferredInvoices = invoices WHERE BranchId=b.Id AND Date=date AND Type=SaleDeferred
var collected = clientPayments WHERE BranchId=b.Id AND Date=date

CashAmount = saleInvoices WHERE PaymentMethod=Cash SUM TotalAmount
VisaAmount = saleInvoices WHERE PaymentMethod=Visa SUM TotalAmount
CheckAmount = saleInvoices WHERE PaymentMethod=Check SUM TotalAmount
DeferredSales = deferredInvoices SUM TotalAmount
DeferredCollected = collected SUM Amount
Returns = returnInvoices SUM TotalAmount
NetRevenue = CashAmount + VisaAmount + CheckAmount + DeferredCollected - Returns
```

---

## Tab 3: مقارنة الفروع

### الفلاتر
- الشهر (month picker)
- أو فترة مخصصة

### البيانات المعروضة
**Cards للكل:**
- أعلى فرع إيراداً هذا الشهر
- أعلى فرع ربحاً

**جدول مقارنة:**
| الفرع | الإيراد | المرتجعات | صافي الإيراد | COGS | الربح | هامش % | عدد الفواتير |
|-------|--------|---------|------------|------|------|--------|-------------|

**Bar chart:** مقارنة الفروع بصرياً

### Backend المطلوب
**موجود:** `BranchComparison` في dashboard (إيراد + عدد فواتير فقط)  
**ناقص — يُضاف لـ ReportController:**
```
GET /api/report/branch-comparison?dateFrom&dateTo
```
**Response:** `List<BranchDetailedComparisonDto>`
```csharp
public class BranchDetailedComparisonDto {
    public int BranchId { get; set; }
    public string BranchName { get; set; }
    public decimal Revenue { get; set; }
    public decimal Returns { get; set; }
    public decimal NetRevenue { get; set; }
    public decimal COGS { get; set; }
    public decimal Profit { get; set; }
    public decimal ProfitMargin { get; set; }
    public int InvoicesCount { get; set; }
}
```

---

## Tab 4: تقرير المنتجات

### الفلاتر
- فترة زمنية
- فرع
- ترتيب حسب: الأعلى إيراداً / الأعلى كمية / الأعلى ربحاً
- عدد النتائج: Top 10 / Top 20 / الكل

### البيانات المعروضة
| # | المنتج | الكمية المباعة | إجمالي الإيراد | إجمالي التكلفة | صافي الربح | هامش % |
|---|--------|--------------|--------------|--------------|-----------|--------|
| 1 | طوب أحمر | 500 | 120,000 | 90,000 | 30,000 | 25% |

**قسم ثاني — تقرير المخزون الحالي:**
| المنتج | الكود | كل الفروع (إجمالي) | القاهرة | الإسكندرية | الجيزة | متوسط التكلفة | قيمة المخزون | الحالة |
|--------|-------|-----------------|--------|-----------|-------|-------------|-------------|--------|

### Backend المطلوب
```
GET /api/report/top-products?dateFrom&dateTo&branchId&limit=10&sortBy=revenue
```
**موجود DTO:** `TopProductDto` ✅  
**ناقص — Service logic:**
```csharp
// من InvoiceItems WHERE Invoice.Type = Sale في الفترة
// GROUP BY ProductId
// SELECT SUM(Quantity), SUM(TotalPrice), SUM(Quantity*CostAtTime), Profit
// ORDER BY sortBy DESC
// TAKE limit
```

```
GET /api/report/inventory-value
```
**Response:** `List<InventoryValueDto>`
```csharp
public class InventoryValueDto {
    public int ProductId { get; set; }
    public string ProductName { get; set; }
    public string ProductCode { get; set; }
    public Dictionary<string, decimal> QuantityPerBranch { get; set; }
    public decimal TotalQuantity { get; set; }
    public decimal AverageCost { get; set; }
    public decimal TotalValue { get; set; }         // TotalQuantity × AverageCost
    public bool IsLowStock { get; set; }
}
```

---

## Tab 5: تقرير المشاريع

### الفلاتر
- الحالة: الكل / نشط / مكتمل / متوقف
- المقاول (dropdown)

### البيانات المعروضة

**Summary Cards:**
- إجمالي عقودنا مع العملاء
- إجمالي محصّل من العملاء
- إجمالي عقودنا مع المقاولين
- إجمالي مدفوع للمقاولين
- هامش الربح الإجمالي
- صافي المحصّل (محصّل − مدفوع)

**جدول المشاريع:**
| المشروع | المقاول | الحالة | عقد العميل | محصّل | متبقي | عقد المقاول | مدفوع | متبقي له | الربح | % الإنجاز |
|---------|--------|-------|-----------|------|------|------------|------|---------|------|----------|

**قسم المواد الموردة للمشاريع:**
- لكل مشروع: قائمة المواد التي سُحبت من المخزون + تكلفتها

### Backend المطلوب
**موجود:** `ProjectSummary` في dashboard (أساسي)  
**ناقص — يُضاف لـ ReportController:**
```
GET /api/report/projects?status&contractorId
```
**Response:** `ProjectsReportDto`
```csharp
public class ProjectsReportDto {
    public decimal TotalClientContracts { get; set; }
    public decimal TotalClientCollected { get; set; }
    public decimal TotalContractorContracts { get; set; }
    public decimal TotalContractorPaid { get; set; }
    public decimal GrossMargin { get; set; }
    public decimal NetCollected { get; set; }
    public List<ProjectDetailedReportDto> Projects { get; set; }
}

public class ProjectDetailedReportDto {
    public int Id { get; set; }
    public string Name { get; set; }
    public string ContractorName { get; set; }
    public string Status { get; set; }
    public decimal ClientContractValue { get; set; }
    public decimal ClientReceived { get; set; }
    public decimal ClientRemaining { get; set; }
    public decimal ContractorContractValue { get; set; }
    public decimal ContractorPaid { get; set; }
    public decimal ContractorRemaining { get; set; }
    public decimal Profit { get; set; }
    public decimal MaterialsCost { get; set; }  // SUM(ProjectMaterialIssues)
}
```

---

## Tab 6: الآجل والعملاء

### القسم الأول — إجمالي الآجل
**Cards:**
- إجمالي الديون على العملاء
- عدد العملاء بديون
- أعلى 3 عملاء ديناً

**جدول العملاء الآجل:**
| العميل | إجمالي الدين | الحد المسموح | % الاستخدام | أقدم فاتورة آجلة | |
|--------|------------|------------|------------|----------------|--|
| شركة الإنشاء | 96,000 | 120,000 | 80% 🔴 | 2025-01-15 | عرض الكشف |

**تحليل التقادم (Aging Analysis):**
| العميل | 0-30 يوم | 31-60 يوم | 61-90 يوم | +90 يوم | الإجمالي |
|--------|---------|---------|---------|--------|---------|

### القسم الثاني — سجل تحصيل الآجل
**جدول:**
| التاريخ | العميل | الفرع | المبلغ المحصّل | طريقة الدفع |
|--------|--------|-------|--------------|------------|

### Backend المطلوب
```
GET /api/report/deferred-aging?dateFrom&dateTo
```
**Response:** `DeferredAgingReportDto`
```csharp
public class DeferredAgingReportDto {
    public decimal TotalDeferred { get; set; }
    public int ClientsWithDebt { get; set; }
    public List<ClientAgingDto> Clients { get; set; }
}

public class ClientAgingDto {
    public int ClientId { get; set; }
    public string ClientName { get; set; }
    public decimal TotalDebt { get; set; }
    public decimal CreditLimit { get; set; }
    public decimal CreditUsagePercent { get; set; }
    public decimal Days0to30 { get; set; }    // من DeferredInvoices.DueDate
    public decimal Days31to60 { get; set; }
    public decimal Days61to90 { get; set; }
    public decimal DaysOver90 { get; set; }
    public DateTime? OldestInvoiceDate { get; set; }
}
```

```
GET /api/report/deferred-collections?dateFrom&dateTo
```
**Response:** `List<DeferredCollectionDto>` — من `ClientPayments` table

---

## Tab 7: تقرير الرواتب

### الفلاتر
- شهر/سنة (month picker)
- فرع
- نوع الموظف: شهري / يومي / الكل

### البيانات المعروضة

**Summary Cards:**
- إجمالي الرواتب المصروفة هذا الشهر
- إجمالي السلف المصروفة
- عدد الموظفين الذين استلموا
- عدد الموظفين المعلقة رواتبهم

**جدول الرواتب:**
| الموظف | الفرع | نوع الراتب | الأساسي | مكافآت | خصومات | سُلف | الصافي المستحق | المدفوع | الحالة |
|--------|-------|-----------|--------|-------|-------|-----|--------------|--------|-------|

**السيناريو الخاص بالعمالة اليومية:**
- الراتب الأساسي = سعر اليوم × عدد أيام العمل في الشهر
- عدد أيام العمل يُحسب من: أيام الشهر − أيام الغياب (لو فيه tracking)
- لو مفيش tracking: يُحسب كـ 26 يوم افتراضي

### Backend المطلوب
**موجود:** `GET /api/employee/salary-payments` (كل الدفعات)  
**ناقص:**
```
GET /api/report/salary-summary?month&year&branchId
```
**موجود DTO:** `SalarySummaryDto` ✅  
**ناقص — Service logic:**
```csharp
// لكل موظف:
// - اجلب SalaryPayments WHERE Month=month AND Year=year
// - اجلب Advances في نفس الشهر (لما يتعمل Advance entity)
// - احسب: Net = BaseSalary + Bonus - Deductions - Advances
// - Status: paid لو فيه payment مسجل، pending لو لأ

// لو salaryType = Daily:
// Net = Employee.Salary × 26  (أو ما يُدخله اليوزر)
```

---

## الـ Printing والتصدير

### لكل Tab:
- زرار **🖨️ طباعة** — يفتح print view بنفس الجدول بدون sidebar
- زرار **📥 تصدير Excel/CSV** — يُنزّل CSV من البيانات الحالية

### Print View Logic:
```javascript
const handlePrint = () => {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(generatePrintHTML(currentTabData, filters));
  printWindow.print();
};
```

---

## الـ API Calls Summary (كل اللي محتاج يتعمل)

### جديد في ReportController:
| Endpoint | Method | من يستخدمه |
|---------|--------|-----------|
| `/api/report/pnl` | GET | Owner, Accountant |
| `/api/report/daily-all` | GET | Owner |
| `/api/report/branch-comparison` | GET | Owner |
| `/api/report/top-products` | GET | Owner, Accountant |
| `/api/report/inventory-value` | GET | Owner, Accountant |
| `/api/report/projects` | GET | Owner, Accountant |
| `/api/report/deferred-aging` | GET | Owner, Accountant |
| `/api/report/deferred-collections` | GET | Owner, Accountant |
| `/api/report/salary-summary` | GET | Owner |

### الـ DTOs اللي محتاج تتعمل:
- `PnLReportDto` ❌ (جديد)
- `DailyBranchRevenueDto` ❌ (جديد)
- `BranchDetailedComparisonDto` ❌ (جديد)
- `InventoryValueDto` ❌ (جديد)
- `ProjectsReportDto` + `ProjectDetailedReportDto` ❌ (جديد)
- `DeferredAgingReportDto` + `ClientAgingDto` ❌ (جديد)
- `DeferredCollectionDto` ❌ (جديد)
- `TopProductDto` ✅ (موجود)
- `SalarySummaryDto` ✅ (موجود)
- `RevenueByPaymentDto` ✅ (موجود)

---

## الـ Frontend Components اللي محتاج تتعمل

```
src/
  pages/
    owner/
      OwnerReports.jsx          ← يتعمل من الأول (حالياً 65 سطر)
    accountant/
      AccountantReports.jsx     ← جديد كلياً (نفس OwnerReports - Tabs 1,2,3,4,5,6)
  components/
    reports/
      RevenueChart.jsx          ✅ موجود
      ProfitChart.jsx           ✅ موجود
      BranchComparison.jsx      ✅ موجود (بسيط)
      ProjectSummary.jsx        ✅ موجود
      PnLTab.jsx                ❌ جديد
      DailyRevenueTab.jsx       ❌ جديد
      BranchComparisonTab.jsx   ❌ جديد (يحل محل الموجود)
      ProductsReportTab.jsx     ❌ جديد
      ProjectsReportTab.jsx     ❌ جديد
      DeferredAgingTab.jsx      ❌ جديد
      SalaryReportTab.jsx       ❌ جديد
      ReportFilters.jsx         ❌ جديد (shared filter bar)
      PrintButton.jsx           ❌ جديد
```

---

## ترتيب التنفيذ المقترح

```
Phase 1 — Backend (يوم واحد):
  1. أضف الـ DTOs الجديدة في ReportDto.cs
  2. أضف الـ methods في IReportService
  3. نفّذ الـ methods في ReportService
  4. أضف الـ endpoints في ReportController

Phase 2 — Frontend Tabs (يومين):
  5. أعد بناء OwnerReports.jsx بـ tab structure
  6. اعمل ReportFilters.jsx (shared)
  7. اعمل كل tab كـ component منفصل
  8. اعمل AccountantReports.jsx (نفس التabs مع إخفاء Salaries)
  9. أضف route في router.jsx للـ accountant
  10. اعمل Print logic
```
