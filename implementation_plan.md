# خطة إصلاح وتكامل النظام - Building Materials ERP

## نظرة عامة

النظام هو ERP لمواد البناء يتكون من:
- **Backend**: ASP.NET Core 8 + SQL Server + EF Core + SignalR + JWT
- **Frontend**: React + Vite + TypeScript

الأدوار: `Owner` (مالك) | `Accountant` (محاسب) | `Staff` (موظف/فرع)

---

## المشاكل المكتشفة والإصلاحات المطلوبة

---

### 🔴 مشكلة 1 — تضارب Mapping في `invTypeFromBackend` (Frontend)

**الملف**: [`realApi.js:14-19`](file:///c:/Users/Mowafy/Desktop/system/frontend/src/api/realApi.js#L14-L19)

**المشكلة**:
```js
const invTypeFromBackend = {
  1: 'sale', 2: 'sale_deferred', ...
  'Sale': 'sale', 'SaleDeferred': 'sale_deferred', ...
};
```
Backend يرسل `InvoiceType` كـ string بسبب `JsonStringEnumConverter` في `Program.cs`. لكن `invTypeToBackend` يُرسل أرقام صحيحة للفلترة:
```js
if (filters.type) params.type = invTypeToBackend[filters.type]; // يرسل 1, 2, 3...
```
بينما API يقبل `int? type` — هذا صحيح. لكن `mapInvoice` يحاول map الـ string القادم من Backend (`"Sale"`) على `invTypeFromBackend` وقد يفشل.

**الإصلاح**: توحيد الـ mapping وتأكيد أن `mapInvoice` يتعامل مع كلا الحالتين.

---

### 🔴 مشكلة 2 — `BranchDeferred`: بيانات الـ Deferred غير صحيحة

**الملف**: [`BranchDeferred.jsx:26-28`](file:///c:/Users/Mowafy/Desktop/system/frontend/src/pages/branch/BranchDeferred.jsx#L26-L28)

**المشكلة**: الصفحة تجلب الفواتير الآجلة عبر `getInvoices({ type: 'sale_deferred' })` وهذا يرجع `Invoice` عادي بدون حقول `remainingAmount`, `paidAmount`, `deferredInvoiceId` لأن هذه الحقول موجودة في جدول `DeferredInvoice` المنفصل.

في `mapInvoice` لا يوجد تعيين لـ `remainingAmount` أو `deferredInvoiceId` من response. الـ `Invoice` response فيه `DeferredInvoice` كـ nested object لكن الـ frontend لا يسحبه.

**الإصلاح في Backend**: التأكد أن `InvoiceResponseDto` يحتوي على `DeferredInvoiceId`, `RemainingAmount`, `PaidAmount`, `DueDate` من الـ nested `DeferredInvoice`.

**الإصلاح في Frontend**: تحديث `mapInvoice` لسحب هذه الحقول:
```js
deferredInvoiceId: data.deferredInvoice?.id,
remainingAmount: data.deferredInvoice?.remainingAmount,
paidAmount: data.deferredInvoice?.paidAmount,
dueDate: data.deferredInvoice?.dueDate ?? data.deferredDueDate,
```

---

### 🔴 مشكلة 3 — `addClientPayment`: `deferredInvoiceId` خاطئ

**الملف**: [`ClientService.cs:86-89`](file:///c:/Users/Mowafy/Desktop/system/backend/BuildingMaterials.Application/Services/ClientService.cs#L86-L89)

```csharp
var deferred = await _context.DeferredInvoices
    .FirstOrDefaultAsync(x => x.Id == dto.DeferredInvoiceId || x.InvoiceId == dto.DeferredInvoiceId)
```

**المشكلة**: يقبل ID الفاتورة أو ID الـ DeferredInvoice — هذا التصميم غير واضح ويسبب ارتباك. الـ Frontend في `BranchDeferred` يرسل `inv.deferredInvoiceId` الذي هو `deferredInvoice.id` — إذا كان هذا null فستفشل العملية.

**الإصلاح**: يجب التأكد أن `InvoiceListDto` يتضمن `deferredInvoice.id` بوضوح، وتبسيط `ClientService.AddPaymentAsync` ليقبل `DeferredInvoiceId` فقط (وليس `InvoiceId`).

---

### 🔴 مشكلة 4 — `InvoiceService.GenerateInvoiceNumberAsync`: Race Condition

**الملف**: [`InvoiceService.cs:532-550`](file:///c:/Users/Mowafy/Desktop/system/backend/BuildingMaterials.Application/Services/InvoiceService.cs#L532-L550)

```csharp
var count = await _context.Invoices
    .Where(x => x.Type == type && x.CreatedAt.Year == year)
    .CountAsync();
return $"{prefix}-{year}-{(count + 1):D6}";
```

**المشكلة**: إذا تزامن طلبان في نفس الوقت، سيحصلا على نفس الرقم → duplicate InvoiceNumber خطأ.

**الإصلاح**: استخدام `InvoiceNumber` كـ Unique Index في DB أو استخدام Sequence في SQL Server أو إضافة Retry logic مع Unique constraint.

---

### 🔴 مشكلة 5 — `PurchaseService`: `RemainingAmount` حساب خاطئ

**الملف**: [`PurchaseService.cs:41`](file:///c:/Users/Mowafy/Desktop/system/backend/BuildingMaterials.Application/Services/PurchaseService.cs#L41)

```csharp
RemainingAmount = dto.TotalAmount + dto.TransportCost - dto.PaidNow
```

لكن بعد ذلك في السطر 86:
```csharp
invoice.TotalAmount = total + dto.TransportCost;
```

**المشكلة**: `dto.TotalAmount` مُمرر من الـ Frontend لكن يُحسب أيضاً داخلياً (`total + TransportCost`). إذا اختلف `dto.TotalAmount` عن الحساب الفعلي للـ items، يحدث تناقض في `RemainingAmount`.

**الإصلاح**: حساب `RemainingAmount` بعد تعيين `invoice.TotalAmount` الفعلي:
```csharp
invoice.TotalAmount = total + dto.TransportCost;
invoice.RemainingAmount = invoice.TotalAmount - dto.PaidNow;
```

---

### 🔴 مشكلة 6 — `Ledger` في `ReportService`: فلتر الـ Branch لا يعمل

**الملف**: [`ReportService.cs:702`](file:///c:/Users/Mowafy/Desktop/system/backend/BuildingMaterials.Application/Services/ReportService.cs#L702)

```csharp
foreach (var inv in saleInvoices.Where(x => !branchId.HasValue || true))
```

**المشكلة**: الشرط `|| true` يجعل فلتر الـ Branch لا يعمل أبداً لفواتير البيع العادية.

**الإصلاح**:
```csharp
foreach (var inv in saleInvoices)
// والفلترة تكون في قاعدة البيانات نفسها
```

يجب إضافة `.Where(x => !branchId.HasValue || x.BranchId == branchId.Value)` في query السطر 699.

---

### 🔴 مشكلة 7 — `PaymentMethod` في `ClientService.AddPaymentAsync`: String Parsing

**الملف**: [`ClientService.cs:113`](file:///c:/Users/Mowafy/Desktop/system/backend/BuildingMaterials.Application/Services/ClientService.cs#L113)

```csharp
if (!Enum.TryParse<PaymentMethod>(dto.PaymentMethod, out var paymentMethod))
```

**المشكلة**: الـ Frontend يرسل `"cash"` (lowercase) لكن `PaymentMethod` enum هو `Cash`, `Visa`, etc. يفشل الـ Parse.

**الإصلاح**: استخدام `ignoreCase: true`:
```csharp
if (!Enum.TryParse<PaymentMethod>(dto.PaymentMethod, ignoreCase: true, out var paymentMethod))
```

> نفس المشكلة موجودة في `PurchaseService.cs` و `EmployeeService.cs`.

---

### 🟡 مشكلة 8 — `getClientDeferred` في Frontend: فلترة خاطئة

**الملف**: [`realApi.js:273-276`](file:///c:/Users/Mowafy/Desktop/system/frontend/src/api/realApi.js#L273-L276)

```js
getClientDeferred: async (clientId) => {
  const data = await http.get('/Client/deferred');
  return (data || []).filter(c => c.id === clientId) || [];
},
```

**المشكلة**: `data` هو list من `Client` وليس `DeferredInvoice`، وفلترة `c.id === clientId` على الـ client ID لكن النتيجة ليست مباشرة مفيدة.

**الإصلاح**: هذه الدالة غير مستخدمة بشكل صحيح. يجب إنشاء endpoint `/Client/{id}/deferred-invoices` أو استخدام `getInvoices({ type: 'sale_deferred', clientId })`.

---

### 🟡 مشكلة 9 — `AuthContext`: لا يعيد التحقق من الـ Token عند Refresh

**الملف**: [`AuthContext.jsx:62-75`](file:///c:/Users/Mowafy/Desktop/system/frontend/src/context/AuthContext.jsx#L62-L75)

```jsx
const checkAuth = useCallback(async () => {
  const stored = localStorage.getItem('erp_user');
  if (stored) {
    try {
      const userData = JSON.parse(stored);
      setUser(userData);
      setIsAuthenticated(true);
      startConnection(); // يبدأ SignalR
    } catch { logout(); }
  }
  setIsInitializing(false);
}, [logout]);
```

**المشكلة**: يثق في localStorage دون التحقق من صحة الـ Token مع Server عند بدء التطبيق. لو كان الـ token منتهياً والـ refresh token منتهياً أيضاً، سيُعتبر المستخدم مُسجَّل دخوله ثم تفشل أول API call.

**الإصلاح**: استدعاء endpoint بسيط مثل `/Auth/me` أو `/Auth/check` عند التهيئة للتحقق من صحة الجلسة.

---

### 🟡 مشكلة 10 — `PosPage`: عدم تحديث المخزون بعد البيع

**الملف**: [`PosPage.jsx:220-224`](file:///c:/Users/Mowafy/Desktop/system/frontend/src/pages/pos/PosPage.jsx#L220-L224)

```jsx
const result = await api.createInvoice(invoiceData);
addNotification('تم حفظ الفاتورة بنجاح', 'success');
setCompletedInvoice(result);
if (!shouldPrint) resetCart();
```

**المشكلة**: بعد إنشاء الفاتورة، الـ `products` state لا يُحدَّث — الكميات في الـ POS تبقى قديمة حتى يُعيد المستخدم تحميل الصفحة.

**الإصلاح**: إعادة جلب بيانات المخزون بعد كل عملية بيع ناجحة.

---

### 🟡 مشكلة 11 — `ReportController`: Endpoints تحتاج `dateFrom`/`dateTo` إلزامية لكنها Optional

**الملف**: [`ReportController.cs:123`](file:///c:/Users/Mowafy/Desktop/system/backend/BuildingMaterials.API/Controllers/ReportController.cs#L123)

```csharp
public async Task<IActionResult> GetRevenueByPayment([FromQuery] DateTime dateFrom, [FromQuery] DateTime dateTo)
```

**المشكلة**: `DateTime` بدون `?` — إذا لم يُرسل الـ Frontend القيم، ستكون `DateTime.MinValue` (1/1/0001) مما يسبب استعلامات غلط.

**الإصلاح**: إضافة `?` أو default values:
```csharp
[FromQuery] DateTime? dateFrom = null, [FromQuery] DateTime? dateTo = null
```

---

### 🟡 مشكلة 12 — `EmployeeService.PaySalaryAsync`: لا يمنع دفع راتب مكرر

**الملف**: [`EmployeeService.cs:121-143`](file:///c:/Users/Mowafy/Desktop/system/backend/BuildingMaterials.Application/Services/EmployeeService.cs#L121-L143)

**المشكلة**: لا يوجد تحقق من أن الراتب لم يُدفع للموظف عن نفس الشهر والسنة من قبل.

**الإصلاح**: إضافة check قبل إنشاء `SalaryPayment`:
```csharp
var exists = await _context.SalaryPayments
    .AnyAsync(x => x.EmployeeId == dto.EmployeeId && x.Month == dto.Month && x.Year == dto.Year);
if (exists) throw new BusinessException("تم دفع راتب هذا الموظف لهذا الشهر بالفعل");
```

---

### 🟡 مشكلة 13 — `client.js`: Retry Logic للـ 401 معطوب

**الملف**: [`client.js:37-93`](file:///c:/Users/Mowafy/Desktop/system/frontend/src/api/client.js#L37-L93)

**المشكلة**: عند التعامل مع 401، يحاول إعادة الطلب (`retryRes`) لكن يستخدم `originalRequest.res._bodyInit` وهذا غير موثوق مع Fetch API الحديثة (`_bodyInit` غير موجود في spec). الـ retry قد يرسل request فارغ.

**الإصلاح**: إعادة بناء الـ retry logic بشكل أكثر موثوقية أو استخدام pattern مختلف (مثل `axios interceptors` أو callback-based retry).

---

### 🟡 مشكلة 14 — `IsCancelled` لا يُفلتر في معظم الاستعلامات

**الملف**: [`InvoiceService.cs:318-353`](file:///c:/Users/Mowafy/Desktop/system/backend/BuildingMaterials.Application/Services/InvoiceService.cs#L318-L353)

**المشكلة**: `GetInvoicesAsync` لا يُضيف `!x.IsCancelled` filter بشكل افتراضي، مما يعني الفواتير الملغاة تظهر في القوائم.

**الإصلاح**: إضافة `.Where(x => !x.IsCancelled)` كـ default أو إضافة فلتر في الـ DTO.

---

## ملخص الإصلاحات حسب الأولوية

### 🔴 حرجة (تؤثر على صحة البيانات)

| # | الملف | المشكلة | الإصلاح |
|---|-------|----------|---------|
| 1 | `realApi.js` + `InvoiceResponseDto` | `deferredInvoiceId`/`remainingAmount` غير مُعاد | تحديث `mapInvoice` وتضمين حقول DeferredInvoice |
| 2 | `ClientService.cs` | `PaymentMethod` parsing case-insensitive | إضافة `ignoreCase: true` |
| 3 | `PurchaseService.cs` | `RemainingAmount` يُحسب من `dto.TotalAmount` الخاطئ | إعادة الحساب بعد تحديد `invoice.TotalAmount` |
| 4 | `ReportService.cs` | فلتر Branch في Ledger معطوب `|| true` | حذف `|| true` وإضافة الفلتر في query |

### 🟡 مهمة (تؤثر على سلامة البيانات)

| # | الملف | المشكلة | الإصلاح |
|---|-------|----------|---------|
| 5 | `InvoiceService.cs` | Race condition في توليد رقم الفاتورة | Unique constraint + Retry |
| 6 | `EmployeeService.cs` | يسمح بدفع راتب مكرر | إضافة uniqueness check |
| 7 | `client.js` | retry logic بعد 401 معطوب | إعادة كتابة |
| 8 | `InvoiceService.cs` | الفواتير الملغاة تظهر في القوائم | إضافة `!IsCancelled` filter |
| 9 | `PosPage.jsx` | المخزون لا يتحدث بعد البيع | إعادة جلب بعد `createInvoice` |
| 10 | `ReportController.cs` | `dateFrom`/`dateTo` غير nullable | تحويل إلى `DateTime?` |

---

## الملفات المتأثرة

### Backend
#### [MODIFY] [InvoiceService.cs](file:///c:/Users/Mowafy/Desktop/system/backend/BuildingMaterials.Application/Services/InvoiceService.cs)
- إضافة `!IsCancelled` في `GetInvoicesAsync`
- إصلاح Race Condition في `GenerateInvoiceNumberAsync`

#### [MODIFY] [ClientService.cs](file:///c:/Users/Mowafy/Desktop/system/backend/BuildingMaterials.Application/Services/ClientService.cs)
- إصلاح `PaymentMethod` parsing (ignoreCase)
- تبسيط `AddPaymentAsync`

#### [MODIFY] [PurchaseService.cs](file:///c:/Users/Mowafy/Desktop/system/backend/BuildingMaterials.Application/Services/PurchaseService.cs)
- إصلاح حساب `RemainingAmount`
- إصلاح `PaymentMethod` parsing (ignoreCase)

#### [MODIFY] [EmployeeService.cs](file:///c:/Users/Mowafy/Desktop/system/backend/BuildingMaterials.Application/Services/EmployeeService.cs)
- منع دفع الراتب المكرر
- إصلاح `PaymentMethod` parsing (ignoreCase)

#### [MODIFY] [ReportService.cs](file:///c:/Users/Mowafy/Desktop/system/backend/BuildingMaterials.Application/Services/ReportService.cs)
- إصلاح bug فلتر Branch في `GetLedgerAsync`

#### [MODIFY] [ReportController.cs](file:///c:/Users/Mowafy/Desktop/system/backend/BuildingMaterials.API/Controllers/ReportController.cs)
- تحويل `DateTime` إلى `DateTime?` في endpoints

### Frontend
#### [MODIFY] [realApi.js](file:///c:/Users/Mowafy/Desktop/system/frontend/src/api/realApi.js)
- إصلاح `mapInvoice` لسحب `deferredInvoice` fields
- تحديث `getClientDeferred` أو حذفها

#### [MODIFY] [client.js](file:///c:/Users/Mowafy/Desktop/system/frontend/src/api/client.js)
- إعادة كتابة retry logic بعد 401

#### [MODIFY] [PosPage.jsx](file:///c:/Users/Mowafy/Desktop/system/frontend/src/pages/pos/PosPage.jsx)
- تحديث المخزون بعد إنشاء الفاتورة

#### [MODIFY] [AuthContext.jsx](file:///c:/Users/Mowafy/Desktop/system/frontend/src/context/AuthContext.jsx)
- إضافة server-side session verification عند التهيئة

---

## خطة التحقق

### Automated
- بناء Backend بدون أخطاء: `dotnet build`
- تشغيل Frontend: `npm run dev`

### Manual Verification
1. ✅ تسجيل دخول بكل role (Owner, Accountant, Staff)
2. ✅ إنشاء فاتورة بيع نقدي وبيع آجل
3. ✅ استلام دفعة على فاتورة آجلة والتحقق من تحديث `remainingAmount`
4. ✅ إنشاء فاتورة مشتريات والتحقق من `RemainingAmount`
5. ✅ دفع راتب ومحاولة تكراره — يجب أن يرفض
6. ✅ التحقق من Ledger مع فلتر Branch
7. ✅ إلغاء فاتورة والتحقق من عدم ظهورها في القوائم

---

## أسئلة مفتوحة

> [!IMPORTANT]
> هل تريد إصلاح كل المشاكل الحرجة والمهمة دفعة واحدة؟ أم نبدأ بالحرجة أولاً؟

> [!NOTE]
> لم أجد DTOs لـ `InvoiceResponseDto` — هل تريد أن أبحث فيها أيضاً لمزيد من الدقة؟
