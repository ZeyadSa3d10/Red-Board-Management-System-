# خطة توحيد نظام الفلترة — Filtering Unification Plan

## الهدف
توحيد الفلترة في كل حتة في السيستم (Backend + Frontend) بحيث تكون:
- سلسة (Smooth)
- سهلة (Easy)
- نفس التصميم في كل مكان (Same Design)
- هوية واحدة (Unified Identity)
- أفضل تجربة مستخدم (Best UX)
- أعلى أداء (High Performance)

---

## Phase 1: Backend Infrastructure

### 1.1 QueryableExtensions (NEW)
`Infrastructure/Extensions/QueryableExtensions.cs`
- `ApplySearch<T>(IQueryable<T>, string?, params Expression<Func<T, string>>[])` — EF.Functions.Like
- `ApplyWhereIf<T>(IQueryable<T>, bool condition, Expression<Func<T, bool>>)` — conditional Where
- `ApplySorting<T>(IQueryable<T>, string? sortBy, string? sortDir)` — dynamic sort via expression trees
- `ApplyPaging<T>(IQueryable<T>, int page, int pageSize)` — Skip/Take
- `ToPagedResultAsync<T, TDto>(IQueryable<T>, BaseFilterDto, IMapper, Expression<Func<T, TDto>>?)` — unified pipeline

### 1.2 تحديث PagedFilterDto
إضافة `SortBy` و `SortDirection` مع Default Values

### 1.3 تحديث PagedResult
إضافة `SortBy` و `SortDirection` في الـ Response

### 1.4 Refactor 8 Services
ProductService, ClientService, SupplierService, EmployeeService,
InvoiceService, PurchaseService, ExpenseService, TransferService

---

## Phase 2: Frontend Core Components

### 2.1 FilterBar.jsx — ترقية
- دعم `loading` state
- دعم `collapsible` للفلاتر الكتيرة
- دعم `onApply` callback
- CSS animations

### 2.2 DateRangePicker.jsx — NEW
- from/to date مع validation
- Quick presets: اليوم, أمس, هذا الأسبوع, هذا الشهر, هذا العام, custom
- موحد في كل الصفحات

### 2.3 SelectFilter.jsx — NEW
- `<select>` موحد مع icon/label
- دعم `allOption` + async loading

### 2.4 useFilters.js — تحديث
- إضافة `debounceMs` option
- إضافة `onFilterChange` callback
- تحسين URL sync performance

### 2.5 DataTable.jsx — تحديث
- تعزيز server-side mode
- توحيد الـ loading states
- دعم default sort from API

### 2.6 StockTable.jsx — تحديث
- تحويل لـ server-side filtering
- Pagination بدل visibleCount
- استخدام DataTable أو الحفاظ على التصميم الحالي

### 2.7 CSS — تحديث
- filter CSS variables في variables.css
- توحيد filter-bar styles في global.css
- Responsive behavior

---

## Phase 3: ربط الصفحات بالـ Server-Side

### Pages Conversion:
| Page | From | To |
|------|------|----|
| BranchInvoices | useFilters + filterInputs + visibleCount | useFilters واحد + DataTable serverSide |
| OwnerSales | useFilters + visibleCount | useFilters + DataTable serverSide |
| BranchExpenses | useFilters + filterInputs + quickFilter | useFilters واحد + DataTable serverSide |
| OwnerCustomers | useFilters + client filter | useFilters + getClientsFiltered |
| OwnerSuppliers | useFilters + client filter | useFilters + getSuppliersFiltered |
| OwnerProducts | useFilters + client filter | useFilters + getProductsFiltered |
| BranchTransfers | DataTable searchable + client-side | DataTable serverSide |
| BranchDeferred | local useState + client filter | useFilters + getClientsFiltered |
| BranchReturns | useFilters + client filter | useFilters + server API |
| OwnerEmployees | DataTable searchable + client-side | DataTable serverSide |
| Ledger | custom inline | unified FilterBar + DataTable |
| BranchDailyRevenue | custom inline | unified FilterBar + DataTable |
| AccountantClients | useFilters + client filter | useFilters + getClientsFiltered |
| AccountantSuppliers | useFilters + client filter | useFilters + getSuppliersFiltered |

---

## قائمة الفايلات كاملة

### Backend (10 files)
```
NEW:  BuildingMaterials.Infrastructure/Extensions/QueryableExtensions.cs
EDIT: BuildingMaterials.Application/DTOs/PagedFilterDto.cs
EDIT: BuildingMaterials.Application/DTOs/PagedResult.cs
EDIT: BuildingMaterials.Application/Services/ProductService.cs
EDIT: BuildingMaterials.Application/Services/ClientService.cs
EDIT: BuildingMaterials.Application/Services/SupplierService.cs
EDIT: BuildingMaterials.Application/Services/EmployeeService.cs
EDIT: BuildingMaterials.Application/Services/InvoiceService.cs
EDIT: BuildingMaterials.Application/Services/PurchaseService.cs
EDIT: BuildingMaterials.Application/Services/ExpenseService.cs
EDIT: BuildingMaterials.Application/Services/TransferService.cs
```

### Frontend (30+ files)
```
NEW:  src/components/common/DateRangePicker.jsx
NEW:  src/components/common/SelectFilter.jsx
EDIT: src/components/common/FilterBar.jsx
EDIT: src/components/common/FilterSearch.jsx
EDIT: src/components/common/FilterGroup.jsx
EDIT: src/components/common/FilterActions.jsx
EDIT: src/components/common/DataTable.jsx
EDIT: src/components/inventory/StockTable.jsx
EDIT: src/hooks/useFilters.js
EDIT: src/styles/variables.css
EDIT: src/styles/global.css
EDIT: src/api/realApi.js
EDIT: src/pages/branch/BranchInvoices.jsx
EDIT: src/pages/branch/BranchExpenses.jsx
EDIT: src/pages/branch/BranchTransfers.jsx
EDIT: src/pages/branch/BranchDeferred.jsx
EDIT: src/pages/branch/BranchReturns.jsx
EDIT: src/pages/branch/BranchDailyRevenue.jsx
EDIT: src/pages/branch/Ledger.jsx
EDIT: src/pages/owner/OwnerSales.jsx
EDIT: src/pages/owner/OwnerCustomers.jsx
EDIT: src/pages/owner/OwnerSuppliers.jsx
EDIT: src/pages/owner/OwnerProducts.jsx
EDIT: src/pages/owner/OwnerEmployees.jsx
EDIT: src/pages/accountant/AccountantClients.jsx
EDIT: src/pages/accountant/AccountantSuppliers.jsx
```
