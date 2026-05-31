# خطة الفرونت إند الشاملة — نظام ERP شركة مواد البناء
**ملف التخطيط للـ AI Agent**
**Stack: React + React Bootstrap | Mock API | Professional UI/UX**

---

## 1. نظرة عامة على المشروع

### 1.1 وصف المشروع
نظام ERP متكامل لشركة مواد بناء لديها:
- **3 فروع بيع** + **فرع إداري (المحاسبة)**
- **قسم مشاريع** (توريد وتركيب)
- **3 لوحات تحكم** لأدوار مختلفة

### 1.2 الأدوار (Roles)
| الدور | الكود | الصلاحيات |
|-------|-------|-----------|
| أصحاب الشركة / مديرون | `owner` | كل شيء — قراءة + كتابة كاملة |
| محاسبون | `accountant` | كل شيء + إدارة الموردين + المشاريع + المقاولين |
| موظفو الفروع | `branch_staff` | الفواتير + مخزون الفروع + إيراد اليوم |

---

## 2. هيكل المشروع (Project Structure)

```
src/
├── api/
│   └── mockData/
│       ├── index.js                  # نقطة الدخول للـ mock API
│       ├── branches.js               # بيانات الفروع
│       ├── products.js               # بيانات المنتجات والمخزون
│       ├── invoices.js               # الفواتير بكل أنواعها
│       ├── clients.js                # العملاء والديون الآجلة
│       ├── suppliers.js              # الموردين وحساباتهم
│       ├── projects.js               # المشاريع
│       ├── contractors.js            # المقاولون
│       ├── employees.js              # الموظفون والرواتب
│       └── transfers.js              # أذون التحويل
├── components/
│   ├── common/
│   │   ├── Sidebar.jsx               # الشريط الجانبي المشترك
│   │   ├── TopBar.jsx                # الشريط العلوي
│   │   ├── StatCard.jsx              # بطاقة الإحصائيات
│   │   ├── DataTable.jsx             # جدول البيانات العام
│   │   ├── Modal.jsx                 # النوافذ المنبثقة
│   │   ├── Badge.jsx                 # الشارات
│   │   ├── SearchBar.jsx             # البحث
│   │   └── LoadingSpinner.jsx        # التحميل
│   ├── invoices/
│   │   ├── SalesInvoiceForm.jsx      # نموذج فاتورة المبيعات
│   │   ├── ProjectInvoiceForm.jsx    # نموذج فاتورة المشاريع
│   │   ├── ReturnInvoiceForm.jsx     # نموذج المرتجعات
│   │   ├── InvoiceCard.jsx           # بطاقة الفاتورة
│   │   └── InvoicePrint.jsx          # طباعة الفاتورة
│   ├── inventory/
│   │   ├── StockTable.jsx            # جدول المخزون
│   │   ├── ProductCard.jsx           # بطاقة المنتج
│   │   └── LowStockAlert.jsx         # تنبيه المخزون المنخفض
│   ├── projects/
│   │   ├── ProjectCard.jsx           # بطاقة المشروع
│   │   ├── ProjectForm.jsx           # نموذج إضافة مشروع
│   │   └── ContractorPayments.jsx    # مدفوعات المقاول
│   └── reports/
│       ├── RevenueChart.jsx          # مخطط الإيرادات
│       ├── ProfitChart.jsx           # مخطط الأرباح
│       └── BranchComparison.jsx      # مقارنة الفروع
├── pages/
│   ├── Login.jsx                     # صفحة الدخول
│   ├── owner/
│   │   ├── OwnerDashboard.jsx        # لوحة تحكم المالك الرئيسية
│   │   ├── OwnerInventory.jsx        # المخزون الكامل
│   │   ├── OwnerSales.jsx            # المبيعات والأرباح
│   │   ├── OwnerEmployees.jsx        # الموظفون والرواتب
│   │   ├── OwnerProjects.jsx         # المشاريع الكاملة
│   │   ├── OwnerContractors.jsx      # المقاولون
│   │   └── OwnerReports.jsx          # التقارير الشاملة
│   ├── accountant/
│   │   ├── AccountantDashboard.jsx   # لوحة تحكم المحاسب
│   │   ├── AccountantSuppliers.jsx   # الموردون وفواتيرهم
│   │   ├── AccountantPurchases.jsx   # إضافة مشتريات للمخزون
│   │   ├── AccountantProjects.jsx    # إدارة المشاريع
│   │   ├── AccountantContractors.jsx # إدارة المقاولين والدفعات
│   │   └── AccountantClients.jsx     # حسابات العملاء الآجلة
│   └── branch/
│       ├── BranchDashboard.jsx       # لوحة تحكم الفرع
│       ├── BranchInvoices.jsx        # الفواتير
│       ├── BranchInventory.jsx       # المخزون
│       ├── BranchDailyRevenue.jsx    # إيراد اليوم
│       └── BranchDeferred.jsx        # الآجل والعملاء
├── context/
│   ├── AuthContext.jsx               # سياق المصادقة
│   ├── AppContext.jsx                # السياق العام
│   └── NotificationContext.jsx       # الإشعارات
├── hooks/
│   ├── useAuth.js                    # هوك المصادقة
│   ├── useInventory.js               # هوك المخزون
│   ├── useInvoices.js                # هوك الفواتير
│   └── useReports.js                 # هوك التقارير
├── utils/
│   ├── formatters.js                 # تنسيق الأرقام والتواريخ
│   ├── calculations.js               # الحسابات
│   └── validators.js                 # التحقق من البيانات
├── styles/
│   ├── variables.css                 # متغيرات CSS
│   ├── global.css                    # الأنماط العامة
│   └── theme.css                     # الثيم
├── App.jsx
├── main.jsx
└── router.jsx
```

---

## 3. نظام الألوان والتصميم

### 3.1 لوحة الألوان (Color Palette)
```css
:root {
  /* Primary — Deep Blue-Gray (Professional & Calm) */
  --color-primary:        #2C3E50;   /* الأزرق الغامق للأساسيات */
  --color-primary-light:  #34495E;   /* أفتح قليلاً */
  --color-primary-hover:  #1A252F;   /* عند التمرير */

  /* Accent — Warm Teal */
  --color-accent:         #1ABC9C;   /* الأخضر المائي للتأكيد */
  --color-accent-light:   #A8E6DF;   /* خلفيات الأكسنت */

  /* Backgrounds */
  --color-bg:             #F4F6F9;   /* خلفية الصفحة */
  --color-surface:        #FFFFFF;   /* خلفية البطاقات */
  --color-surface-alt:    #EEF2F7;   /* خلفية بديلة */
  --color-border:         #DDE3EC;   /* الحدود */

  /* Text */
  --color-text-primary:   #1E2A38;   /* النص الرئيسي */
  --color-text-secondary: #6B7A8D;   /* النص الثانوي */
  --color-text-muted:     #9AAAB8;   /* النص الخافت */

  /* Status Colors */
  --color-success:        #27AE60;   /* نجاح */
  --color-success-light:  #D4EFDF;
  --color-warning:        #F39C12;   /* تحذير */
  --color-warning-light:  #FDEBD0;
  --color-danger:         #E74C3C;   /* خطر */
  --color-danger-light:   #FADBD8;
  --color-info:           #2980B9;   /* معلومات */
  --color-info-light:     #D6EAF8;

  /* Sidebar */
  --sidebar-bg:           #1E2A38;   /* خلفية الشريط الجانبي */
  --sidebar-text:         #BDC8D4;   /* نص الشريط الجانبي */
  --sidebar-active:       #1ABC9C;   /* العنصر النشط */
  --sidebar-hover:        #263545;   /* عند التمرير */

  /* Shadows */
  --shadow-card:   0 2px 8px rgba(0,0,0,0.06);
  --shadow-modal:  0 8px 32px rgba(0,0,0,0.12);
  --shadow-hover:  0 4px 16px rgba(0,0,0,0.10);

  /* Typography */
  --font-primary:  'Cairo', sans-serif;   /* للعربي */
  --font-numbers:  'IBM Plex Mono', monospace; /* للأرقام */

  /* Spacing */
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  16px;
  --radius-xl:  24px;

  /* Transitions */
  --transition: all 0.2s ease;
}
```

### 3.2 مبادئ التصميم
- **اتجاه الكتابة**: RTL كامل (`dir="rtl"`)
- **الخطوط**: Cairo (Google Fonts) للعربي + IBM Plex Mono للأرقام
- **لا gradients**: ألوان صلبة فقط، مع shadows خفيفة للعمق
- **Sidebar**: داكن (navy) مع نص فاتح — يعطي شعور الاحترافية
- **Cards**: بيضاء مع border رفيع وshadow ناعم
- **Tables**: zebra stripes خفيفة، hover state واضح

---

## 4. Mock API — البيانات الكاملة

### 4.1 ملف `branches.js`
```javascript
export const branches = [
  { id: 'B001', name: 'فرع الإسكندرية', location: 'الإسكندرية، المنطقة الصناعية', manager: 'E001', phone: '03-4567890', status: 'active' },
  { id: 'B002', name: 'فرع القاهرة', location: 'القاهرة، مدينة نصر', manager: 'E004', phone: '02-2345678', status: 'active' },
  { id: 'B003', name: 'فرع الجيزة', location: 'الجيزة، الهرم', manager: 'E007', phone: '02-3456789', status: 'active' },
  { id: 'B004', name: 'الإدارة المركزية', location: 'القاهرة، وسط البلد', manager: null, phone: '02-1234567', status: 'admin', isAdmin: true }
];
```

### 4.2 ملف `products.js`
```javascript
export const categories = [
  { id: 'CAT001', name: 'طوب وبلوك' },
  { id: 'CAT002', name: 'أسمنت وملاط' },
  { id: 'CAT003', name: 'حديد تسليح' },
  { id: 'CAT004', name: 'سيراميك وبلاط' },
  { id: 'CAT005', name: 'دهانات' },
  { id: 'CAT006', name: 'أدوات صحية' },
  { id: 'CAT007', name: 'كهرباء وإضاءة' },
  { id: 'CAT008', name: 'خشب وألمونيوم' }
];

export const products = [
  {
    id: 'P001',
    name: 'طوب أحمر',
    categoryId: 'CAT001',
    unit: 'ألف طوبة',
    purchasePrice: 850,       // سعر الشراء (المستحق للمخزون)
    minSalePrice: 950,        // أقل سعر بيع مسموح
    currentSalePrice: 1050,   // السعر الحالي
    stock: {
      B001: { qty: 150, avgCost: 850 },
      B002: { qty: 200, avgCost: 860 },
      B003: { qty: 80,  avgCost: 845 }
    },
    minStockAlert: 50,        // حد التنبيه
    barcode: '6900001001',
    isActive: true
  },
  {
    id: 'P002',
    name: 'أسمنت بورتلاند 42.5',
    categoryId: 'CAT002',
    unit: 'طن',
    purchasePrice: 1800,
    minSalePrice: 1950,
    currentSalePrice: 2100,
    stock: {
      B001: { qty: 50,  avgCost: 1800 },
      B002: { qty: 75,  avgCost: 1810 },
      B003: { qty: 30,  avgCost: 1795 }
    },
    minStockAlert: 20,
    barcode: '6900002001',
    isActive: true
  },
  {
    id: 'P003',
    name: 'حديد 10 مم تسليح',
    categoryId: 'CAT003',
    unit: 'طن',
    purchasePrice: 15000,
    minSalePrice: 15800,
    currentSalePrice: 16500,
    stock: {
      B001: { qty: 20, avgCost: 15000 },
      B002: { qty: 35, avgCost: 15100 },
      B003: { qty: 12, avgCost: 14950 }
    },
    minStockAlert: 10,
    barcode: '6900003001',
    isActive: true
  },
  {
    id: 'P004',
    name: 'سيراميك 60x60 بيج',
    categoryId: 'CAT004',
    unit: 'متر مربع',
    purchasePrice: 85,
    minSalePrice: 100,
    currentSalePrice: 120,
    stock: {
      B001: { qty: 800, avgCost: 85 },
      B002: { qty: 600, avgCost: 87 },
      B003: { qty: 400, avgCost: 84 }
    },
    minStockAlert: 100,
    barcode: '6900004001',
    isActive: true
  },
  {
    id: 'P005',
    name: 'دهان أساس أبيض',
    categoryId: 'CAT005',
    unit: 'جالون (4 لتر)',
    purchasePrice: 45,
    minSalePrice: 55,
    currentSalePrice: 65,
    stock: {
      B001: { qty: 200, avgCost: 45 },
      B002: { qty: 180, avgCost: 46 },
      B003: { qty: 90,  avgCost: 44 }
    },
    minStockAlert: 50,
    barcode: '6900005001',
    isActive: true
  }
];

// دالة حساب إجمالي المخزون
export const getTotalStock = (productId) => {
  const p = products.find(x => x.id === productId);
  if (!p) return 0;
  return Object.values(p.stock).reduce((sum, b) => sum + b.qty, 0);
};

// دالة حساب قيمة المخزون
export const getStockValue = (productId, branchId = null) => {
  const p = products.find(x => x.id === productId);
  if (!p) return 0;
  if (branchId) {
    const b = p.stock[branchId];
    return b ? b.qty * b.avgCost : 0;
  }
  return Object.values(p.stock).reduce((sum, b) => sum + (b.qty * b.avgCost), 0);
};
```

### 4.3 ملف `employees.js`
```javascript
export const employees = [
  // موظفو الفروع
  { id: 'E001', name: 'أحمد محمود سالم',     role: 'branch_manager', branchId: 'B001', salary: 5000,  phone: '01001234567', nationalId: '28901010101010', joinDate: '2020-01-15', status: 'active' },
  { id: 'E002', name: 'محمد علي حسن',        role: 'branch_staff',   branchId: 'B001', salary: 3500,  phone: '01012345678', nationalId: '29501010202020', joinDate: '2021-03-10', status: 'active' },
  { id: 'E003', name: 'عمر خالد إبراهيم',    role: 'branch_staff',   branchId: 'B001', salary: 3500,  phone: '01023456789', nationalId: '29701010303030', joinDate: '2021-06-20', status: 'active' },
  { id: 'E004', name: 'كريم عبد الرحمن',     role: 'branch_manager', branchId: 'B002', salary: 5000,  phone: '01034567890', nationalId: '28801010404040', joinDate: '2020-02-01', status: 'active' },
  { id: 'E005', name: 'سامي رضا مصطفى',      role: 'branch_staff',   branchId: 'B002', salary: 3500,  phone: '01045678901', nationalId: '29201010505050', joinDate: '2022-01-05', status: 'active' },
  { id: 'E006', name: 'طارق حسين محمد',      role: 'branch_staff',   branchId: 'B002', salary: 3500,  phone: '01056789012', nationalId: '29401010606060', joinDate: '2022-04-15', status: 'active' },
  { id: 'E007', name: 'ياسر أحمد فاروق',     role: 'branch_manager', branchId: 'B003', salary: 5000,  phone: '01067890123', nationalId: '28701010707070', joinDate: '2020-03-10', status: 'active' },
  { id: 'E008', name: 'هاني محمود عثمان',    role: 'branch_staff',   branchId: 'B003', salary: 3500,  phone: '01078901234', nationalId: '29601010808080', joinDate: '2021-09-01', status: 'active' },
  // عمال التحميل والنقل
  { id: 'E009', name: 'حسام سيد أحمد',       role: 'worker',         branchId: 'B001', salary: 2500,  phone: '01089012345', nationalId: '29001010909090', joinDate: '2021-11-20', status: 'active' },
  { id: 'E010', name: 'وائل مصطفى علي',      role: 'worker',         branchId: 'B002', salary: 2500,  phone: '01090123456', nationalId: '29801011010101', joinDate: '2022-02-14', status: 'active' },
  // المحاسبون
  { id: 'E011', name: 'سعيد إبراهيم ناصر',   role: 'accountant',     branchId: 'B004', salary: 7000,  phone: '01101234567', nationalId: '28501011111111', joinDate: '2019-07-01', status: 'active' },
  { id: 'E012', name: 'ريم محمد الشرقاوي',   role: 'accountant',     branchId: 'B004', salary: 6500,  phone: '01112345678', nationalId: '29001011212121', joinDate: '2020-05-15', status: 'active' },
  // أصحاب الشركة
  { id: 'E013', name: 'المهندس رامي السيد',  role: 'owner',          branchId: null,   salary: null,  phone: '01123456789', nationalId: '26501011313131', joinDate: '2015-01-01', status: 'active' },
  { id: 'E014', name: 'خالد عبد العزيز',     role: 'owner',          branchId: null,   salary: null,  phone: '01134567890', nationalId: '27001011414141', joinDate: '2015-01-01', status: 'active' }
];

export const roleLabels = {
  owner:          'مالك الشركة',
  accountant:     'محاسب',
  branch_manager: 'مدير فرع',
  branch_staff:   'موظف فرع',
  worker:         'عامل'
};

export const salaryPayments = [
  { id: 'SP001', employeeId: 'E001', month: '2025-01', amount: 5000, paidDate: '2025-01-30', status: 'paid' },
  { id: 'SP002', employeeId: 'E002', month: '2025-01', amount: 3500, paidDate: '2025-01-30', status: 'paid' },
  // ... المزيد من بيانات الرواتب
];
```

### 4.4 ملف `clients.js`
```javascript
export const clients = [
  { id: 'C001', name: 'شركة النيل للمقاولات',   phone: '01201234567', type: 'company',    totalDeferred: 45000,  address: 'القاهرة' },
  { id: 'C002', name: 'المهندس هشام سعد',       phone: '01212345678', type: 'individual', totalDeferred: 12500,  address: 'الجيزة' },
  { id: 'C003', name: 'مقاولات البناء الحديث',  phone: '01223456789', type: 'company',    totalDeferred: 78000,  address: 'الإسكندرية' },
  { id: 'C004', name: 'أ/ عمر فاروق منصور',     phone: '01234567890', type: 'individual', totalDeferred: 5500,   address: 'القاهرة' },
  { id: 'C005', name: 'شركة الإنشاء والتعمير',  phone: '01245678901', type: 'company',    totalDeferred: 135000, address: 'الإسكندرية' }
];

// الفواتير الآجلة لكل عميل
export const deferredInvoices = [
  {
    id: 'DI001',
    clientId: 'C001',
    invoiceId: 'INV002',
    originalAmount: 25000,
    paidAmount: 15000,
    remainingAmount: 10000,
    dueDate: '2025-03-15',
    branchId: 'B001',
    createdAt: '2025-01-15',
    status: 'partial'   // paid | partial | unpaid | overdue
  },
  // ... المزيد
];

// دفعات العملاء
export const clientPayments = [
  {
    id: 'CP001',
    clientId: 'C001',
    deferredInvoiceId: 'DI001',
    amount: 15000,
    paymentMethod: 'bank_transfer',
    date: '2025-02-01',
    branchId: 'B001',
    receivedBy: 'E002',
    notes: 'تحويل بنكي'
  }
];
```

### 4.5 ملف `suppliers.js`
```javascript
export const suppliers = [
  { id: 'SUP001', name: 'مصنع الطوب الأحمر المتحد',    phone: '01301234567', categoryId: 'CAT001', totalDue: 85000,  totalPaid: 120000, address: 'الإسكندرية' },
  { id: 'SUP002', name: 'شركة أسمنت السويس',           phone: '01312345678', categoryId: 'CAT002', totalDue: 54000,  totalPaid: 200000, address: 'السويس' },
  { id: 'SUP003', name: 'حديد المصريين',               phone: '01323456789', categoryId: 'CAT003', totalDue: 150000, totalPaid: 500000, address: 'القاهرة' },
  { id: 'SUP004', name: 'كليوباترا للسيراميك',         phone: '01334567890', categoryId: 'CAT004', totalDue: 32000,  totalPaid: 180000, address: 'القاهرة' },
  { id: 'SUP005', name: 'دهانات الجزيرة',              phone: '01345678901', categoryId: 'CAT005', totalDue: 18000,  totalPaid: 75000,  address: 'الجيزة' }
];

// فواتير الشراء من الموردين
export const purchaseInvoices = [
  {
    id: 'PINV001',
    supplierId: 'SUP001',
    branchId: 'B001',
    items: [
      { productId: 'P001', qty: 50, unitCost: 850, totalCost: 42500 }
    ],
    totalAmount: 42500,
    paidAmount: 20000,
    remainingAmount: 22500,
    date: '2025-01-10',
    addedBy: 'E011',      // المحاسب الذي أضاف الفاتورة
    status: 'partial',
    notes: 'دفعة أولى'
  }
  // ... المزيد
];

// دفعات للموردين
export const supplierPayments = [
  {
    id: 'SPAY001',
    supplierId: 'SUP001',
    purchaseInvoiceId: 'PINV001',
    amount: 20000,
    paymentMethod: 'check',
    date: '2025-01-15',
    paidBy: 'E011',
    checkNumber: 'CHK-001-2025',
    notes: 'شيك بنك الأهلي'
  }
];
```

### 4.6 ملف `contractors.js`
```javascript
export const contractors = [
  {
    id: 'CON001',
    name: 'مقاولات الإنشاء المصرية',
    ownerName: 'المهندس محمد رأفت',
    phone: '01401234567',
    specialization: 'مقاولات عامة',
    status: 'active',
    totalContractValue: 850000,   // إجمالي قيمة عقوده مع الشركة
    totalPaid: 620000,             // إجمالي ما دُفع له
    totalRemaining: 230000,        // إجمالي المتبقي له
    projectsCount: 3,
    joinDate: '2022-01-01'
  },
  {
    id: 'CON002',
    name: 'شركة الفنيين المتخصصين',
    ownerName: 'أ/ علاء الدين فوزي',
    phone: '01412345678',
    specialization: 'تركيبات كهرباء وسباكة',
    status: 'active',
    totalContractValue: 320000,
    totalPaid: 260000,
    totalRemaining: 60000,
    projectsCount: 2,
    joinDate: '2022-06-15'
  },
  {
    id: 'CON003',
    name: 'مقاولات البناء الفني',
    ownerName: 'م/ حسن القاضي',
    phone: '01423456789',
    specialization: 'بناء وتشطيبات',
    status: 'active',
    totalContractValue: 500000,
    totalPaid: 500000,
    totalRemaining: 0,
    projectsCount: 1,
    joinDate: '2021-09-01'
  }
];

// دفعات المقاولين على مستوى المشاريع
export const contractorProjectPayments = [
  {
    id: 'CPP001',
    contractorId: 'CON001',
    projectId: 'PRJ001',
    amount: 200000,
    date: '2025-01-20',
    method: 'bank_transfer',
    paidBy: 'E011',
    notes: 'دفعة مقدم'
  }
  // ... المزيد
];
```

### 4.7 ملف `projects.js`
```javascript
export const projects = [
  {
    id: 'PRJ001',
    name: 'مشروع تشطيب عمارة النرجس',
    clientName: 'شركة النرجس للاستثمار العقاري',
    clientPhone: '01501234567',
    location: 'القاهرة الجديدة، التجمع الخامس',
    contractorId: 'CON001',
    startDate: '2025-01-01',
    expectedEndDate: '2025-06-30',
    actualEndDate: null,
    status: 'active',    // draft | active | completed | paused | cancelled

    // حساب الشركة مع العميل
    clientContractValue: 1200000,    // إجمالي العقد مع العميل
    clientTotalReceived: 750000,      // إجمالي المستلم من العميل
    clientTotalRemaining: 450000,     // المتبقي من العميل

    // حساب الشركة مع المقاول
    contractorContractValue: 850000,  // إجمالي المتفق عليه مع المقاول
    contractorTotalPaid: 450000,      // إجمالي المدفوع للمقاول
    contractorTotalRemaining: 400000, // المتبقي للمقاول

    // مواد الإنتاج (من المخزون — بدون أسعار في الفاتورة)
    materialsIssued: [
      { id: 'MI001', productId: 'P001', qty: 50, branchId: 'B001', date: '2025-01-05', issuedBy: 'E002' },
      { id: 'MI002', productId: 'P003', qty: 5,  branchId: 'B002', date: '2025-01-10', issuedBy: 'E005' }
    ],

    // الدفعات المستلمة من العميل
    clientPayments: [
      { id: 'PP001', amount: 400000, date: '2025-01-01', method: 'check', notes: 'دفعة أولى مقدم', receivedBy: 'E011' },
      { id: 'PP002', amount: 350000, date: '2025-03-01', method: 'bank_transfer', notes: 'دفعة ثانية', receivedBy: 'E012' }
    ],

    // الدفعات المدفوعة للمقاول
    contractorPayments: [
      { id: 'CP001', amount: 250000, date: '2025-01-05',  method: 'check', notes: 'مقدم المقاول', paidBy: 'E011' },
      { id: 'CP002', amount: 200000, date: '2025-02-15',  method: 'bank_transfer', notes: 'دفعة مرحلة أولى', paidBy: 'E011' }
    ],

    addedBy: 'E011',
    createdAt: '2025-01-01',
    notes: 'مشروع تشطيب كامل لعمارة 10 طوابق'
  },
  {
    id: 'PRJ002',
    name: 'تركيبات كهرباء وسباكة مجمع الياسمين',
    clientName: 'المهندس نادر حمدي',
    clientPhone: '01512345678',
    location: 'الإسكندرية، برج العرب',
    contractorId: 'CON002',
    startDate: '2025-02-01',
    expectedEndDate: '2025-05-31',
    actualEndDate: null,
    status: 'active',
    clientContractValue: 320000,
    clientTotalReceived: 180000,
    clientTotalRemaining: 140000,
    contractorContractValue: 220000,
    contractorTotalPaid: 120000,
    contractorTotalRemaining: 100000,
    materialsIssued: [
      { id: 'MI003', productId: 'P005', qty: 100, branchId: 'B001', date: '2025-02-05', issuedBy: 'E002' }
    ],
    clientPayments: [
      { id: 'PP003', amount: 180000, date: '2025-02-01', method: 'cash', notes: 'مقدم', receivedBy: 'E011' }
    ],
    contractorPayments: [
      { id: 'CP003', amount: 120000, date: '2025-02-05', method: 'bank_transfer', notes: 'مقدم المقاول', paidBy: 'E012' }
    ],
    addedBy: 'E012',
    createdAt: '2025-02-01',
    notes: ''
  }
];
```

### 4.8 ملف `invoices.js`
```javascript
// أنواع الفواتير
export const INVOICE_TYPES = {
  SALE:            'sale',           // بيع نقدي
  SALE_DEFERRED:   'sale_deferred',  // بيع آجل
  RETURN_SALE:     'return_sale',    // مرتجع مبيعات نقدي
  RETURN_DEFERRED: 'return_deferred',// مرتجع مبيعات آجل
  PROJECT_ISSUE:   'project_issue',  // إخراج بضاعة لمشروع
  RETURN_PROJECT:  'return_project', // مرتجع من مشروع
  TRANSFER:        'transfer'        // تحويل بين فروع
};

// طرق الدفع
export const PAYMENT_METHODS = {
  CASH:  'cash',   // نقدي
  VISA:  'visa',   // فيزا/بطاقة
  CHECK: 'check'   // شيك
};

export const invoices = [
  // --- فاتورة بيع نقدي ---
  {
    id: 'INV001',
    type: INVOICE_TYPES.SALE,
    branchId: 'B001',
    clientId: null,
    clientName: 'عميل نقدي',     // للبيع النقدي لا يلزم عميل مسجل
    items: [
      { productId: 'P001', qty: 5, unitPrice: 1050, totalPrice: 5250 },
      { productId: 'P005', qty: 10, unitPrice: 65, totalPrice: 650 }
    ],
    subtotal: 5900,
    discount: 0,
    totalAmount: 5900,
    paymentMethod: PAYMENT_METHODS.CASH,
    createdBy: 'E002',
    createdAt: '2025-01-20T10:30:00',
    notes: ''
  },

  // --- فاتورة بيع آجل ---
  {
    id: 'INV002',
    type: INVOICE_TYPES.SALE_DEFERRED,
    branchId: 'B001',
    clientId: 'C001',
    clientName: 'شركة النيل للمقاولات',
    items: [
      { productId: 'P003', qty: 2, unitPrice: 16500, totalPrice: 33000 },
      { productId: 'P002', qty: 5, unitPrice: 2100,  totalPrice: 10500 }
    ],
    subtotal: 43500,
    discount: 500,
    totalAmount: 43000,
    paymentMethod: null,          // آجل — لا يوجد دفع فوري
    deferredDueDate: '2025-03-15',
    createdBy: 'E002',
    createdAt: '2025-01-22T14:15:00',
    notes: 'شيك بتاريخ 15 مارس'
  },

  // --- فاتورة مرتجع مبيعات ---
  {
    id: 'INV003',
    type: INVOICE_TYPES.RETURN_SALE,
    branchId: 'B001',
    relatedInvoiceId: 'INV001',
    clientId: null,
    clientName: 'عميل نقدي',
    items: [
      { productId: 'P005', qty: 2, unitPrice: 65, totalPrice: 130 }  // مرتجع جزئي
    ],
    subtotal: 130,
    discount: 0,
    totalAmount: 130,
    createdBy: 'E002',
    createdAt: '2025-01-23T09:00:00',
    notes: 'مرتجع — بضاعة تالفة'
  },

  // --- إذن إخراج لمشروع ---
  {
    id: 'INV004',
    type: INVOICE_TYPES.PROJECT_ISSUE,
    branchId: 'B001',
    projectId: 'PRJ001',
    contractorId: 'CON001',
    items: [
      { productId: 'P001', qty: 20, unitPrice: null, totalPrice: null },  // بدون سعر
      { productId: 'P004', qty: 150, unitPrice: null, totalPrice: null }
    ],
    totalAmount: 0,     // لا توجد قيمة مالية
    createdBy: 'E002',
    createdAt: '2025-01-25T11:00:00',
    notes: 'إخراج مرحلة أولى مشروع النرجس'
  },

  // --- إذن تحويل ---
  {
    id: 'INV005',
    type: INVOICE_TYPES.TRANSFER,
    sourceBranchId: 'B002',
    destinationBranchId: 'B001',
    items: [
      { productId: 'P002', qty: 10, unitCost: 1810 }
    ],
    createdBy: 'E004',
    approvedBy: 'E011',
    createdAt: '2025-01-26T08:30:00',
    status: 'completed',    // pending | completed | rejected
    notes: 'تغطية نقص مخزون'
  }
];

// ========== دوال Mock API ==========

// إنشاء فاتورة مبيعات جديدة وتحديث المخزون
export const createSaleInvoice = (invoiceData) => {
  const newInvoice = {
    ...invoiceData,
    id: `INV${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  // تحديث المخزون: خصم الكميات
  newInvoice.items.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    if (product && product.stock[newInvoice.branchId]) {
      product.stock[newInvoice.branchId].qty -= item.qty;
    }
  });

  // إضافة للإيراد اليومي إذا كان نقدي
  if (newInvoice.type === INVOICE_TYPES.SALE) {
    addToDailyRevenue(newInvoice.branchId, newInvoice.totalAmount, newInvoice.paymentMethod);
  }

  invoices.push(newInvoice);
  return newInvoice;
};

// حساب إيراد اليوم لفرع معين
export const getDailyRevenue = (branchId, date = new Date().toISOString().split('T')[0]) => {
  const dayInvoices = invoices.filter(inv =>
    (inv.branchId === branchId || inv.sourceBranchId === branchId) &&
    inv.createdAt.startsWith(date) &&
    inv.type === INVOICE_TYPES.SALE
  );

  const returns = invoices.filter(inv =>
    inv.branchId === branchId &&
    inv.createdAt.startsWith(date) &&
    inv.type === INVOICE_TYPES.RETURN_SALE
  );

  const totalSales = dayInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalReturns = returns.reduce((sum, inv) => sum + inv.totalAmount, 0);

  // الدفعات المستلمة على حسابات الآجل في هذا اليوم
  const deferredPayments = clientPayments
    .filter(p => p.branchId === branchId && p.date === date)
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    totalSales,
    totalReturns,
    deferredPayments,
    netRevenue: totalSales - totalReturns + deferredPayments,
    invoicesCount: dayInvoices.length,
    cash: dayInvoices.filter(i => i.paymentMethod === 'cash').reduce((s, i) => s + i.totalAmount, 0),
    visa: dayInvoices.filter(i => i.paymentMethod === 'visa').reduce((s, i) => s + i.totalAmount, 0),
    check: dayInvoices.filter(i => i.paymentMethod === 'check').reduce((s, i) => s + i.totalAmount, 0)
  };
};
```

### 4.9 ملف `index.js` (نقطة دخول الـ Mock API)
```javascript
import { branches } from './branches';
import { products, categories, getTotalStock, getStockValue } from './products';
import { employees, roleLabels, salaryPayments } from './employees';
import { clients, deferredInvoices, clientPayments } from './clients';
import { suppliers, purchaseInvoices, supplierPayments } from './suppliers';
import { contractors, contractorProjectPayments } from './contractors';
import { projects } from './projects';
import { invoices, INVOICE_TYPES, PAYMENT_METHODS, createSaleInvoice, getDailyRevenue } from './invoices';

// محاكاة تأخير الشبكة
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // ===== Auth =====
  login: async (username, password) => {
    await delay();
    const user = employees.find(e => e.phone === username);
    if (user && password === '1234') {
      return { success: true, user, token: `mock-token-${user.id}` };
    }
    return { success: false, message: 'بيانات الدخول غير صحيحة' };
  },

  // ===== Branches =====
  getBranches: async () => { await delay(); return branches; },
  getBranchById: async (id) => { await delay(); return branches.find(b => b.id === id); },

  // ===== Products & Inventory =====
  getProducts: async () => { await delay(); return products; },
  getProductsByBranch: async (branchId) => {
    await delay();
    return products.map(p => ({
      ...p,
      branchStock: p.stock[branchId] || { qty: 0, avgCost: 0 }
    }));
  },
  getAllStock: async () => {
    await delay();
    return products.map(p => ({
      ...p,
      totalQty: getTotalStock(p.id),
      totalValue: getStockValue(p.id),
      isLowStock: getTotalStock(p.id) <= p.minStockAlert
    }));
  },

  // ===== Invoices =====
  getInvoices: async (filters = {}) => {
    await delay();
    let result = [...invoices];
    if (filters.branchId) result = result.filter(i => i.branchId === filters.branchId || i.sourceBranchId === filters.branchId);
    if (filters.type) result = result.filter(i => i.type === filters.type);
    if (filters.date) result = result.filter(i => i.createdAt.startsWith(filters.date));
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  createInvoice: async (data) => { await delay(500); return createSaleInvoice(data); },
  getDailyRevenue: async (branchId, date) => { await delay(); return getDailyRevenue(branchId, date); },

  // ===== Clients =====
  getClients: async () => { await delay(); return clients; },
  getClientDeferred: async (clientId) => {
    await delay();
    return deferredInvoices.filter(d => d.clientId === clientId);
  },
  addClientPayment: async (paymentData) => {
    await delay(500);
    const payment = { ...paymentData, id: `CP${Date.now()}` };
    clientPayments.push(payment);
    // تحديث الفاتورة الآجلة
    const deferred = deferredInvoices.find(d => d.id === paymentData.deferredInvoiceId);
    if (deferred) {
      deferred.paidAmount += paymentData.amount;
      deferred.remainingAmount -= paymentData.amount;
      deferred.status = deferred.remainingAmount <= 0 ? 'paid' : 'partial';
    }
    return payment;
  },

  // ===== Suppliers =====
  getSuppliers: async () => { await delay(); return suppliers; },
  getPurchaseInvoices: async () => { await delay(); return purchaseInvoices; },
  addPurchaseInvoice: async (data) => {
    await delay(500);
    const invoice = { ...data, id: `PINV${Date.now()}`, date: new Date().toISOString().split('T')[0] };
    // تحديث المخزون
    data.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        if (!product.stock[data.branchId]) product.stock[data.branchId] = { qty: 0, avgCost: 0 };
        const existing = product.stock[data.branchId];
        const newQty = existing.qty + item.qty;
        existing.avgCost = ((existing.qty * existing.avgCost) + (item.qty * item.unitCost)) / newQty;
        existing.qty = newQty;
      }
    });
    purchaseInvoices.push(invoice);
    return invoice;
  },

  // ===== Projects =====
  getProjects: async () => { await delay(); return projects; },
  getProjectById: async (id) => { await delay(); return projects.find(p => p.id === id); },
  addProject: async (data) => {
    await delay(500);
    const project = { ...data, id: `PRJ${Date.now()}`, createdAt: new Date().toISOString(), status: 'active' };
    projects.push(project);
    return project;
  },
  addProjectClientPayment: async (projectId, paymentData) => {
    await delay(500);
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const payment = { ...paymentData, id: `PP${Date.now()}` };
      project.clientPayments.push(payment);
      project.clientTotalReceived += paymentData.amount;
      project.clientTotalRemaining -= paymentData.amount;
      return payment;
    }
  },
  addProjectContractorPayment: async (projectId, paymentData) => {
    await delay(500);
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const payment = { ...paymentData, id: `CP${Date.now()}` };
      project.contractorPayments.push(payment);
      project.contractorTotalPaid += paymentData.amount;
      project.contractorTotalRemaining -= paymentData.amount;
      return payment;
    }
  },

  // ===== Contractors =====
  getContractors: async () => { await delay(); return contractors; },
  getContractorProjects: async (contractorId) => {
    await delay();
    return projects.filter(p => p.contractorId === contractorId);
  },

  // ===== Employees =====
  getEmployees: async () => { await delay(); return employees; },
  getEmployeesByBranch: async (branchId) => {
    await delay();
    return employees.filter(e => e.branchId === branchId);
  },

  // ===== Transfers =====
  createTransfer: async (data) => {
    await delay(500);
    const transfer = { ...data, id: `TRF${Date.now()}`, createdAt: new Date().toISOString(), status: 'completed' };
    // تحديث المخزون
    data.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        if (product.stock[data.sourceBranchId]) product.stock[data.sourceBranchId].qty -= item.qty;
        if (!product.stock[data.destinationBranchId]) product.stock[data.destinationBranchId] = { qty: 0, avgCost: item.unitCost };
        product.stock[data.destinationBranchId].qty += item.qty;
      }
    });
    return transfer;
  },

  // ===== Dashboard Stats =====
  getOwnerDashboardStats: async () => {
    await delay();
    return {
      totalInventoryValue: products.reduce((sum, p) => sum + getStockValue(p.id), 0),
      totalDeferredFromClients: clients.reduce((sum, c) => sum + c.totalDeferred, 0),
      totalDueToSuppliers: suppliers.reduce((sum, s) => sum + s.totalDue, 0),
      activeProjects: projects.filter(p => p.status === 'active').length,
      totalProjectRevenue: projects.reduce((sum, p) => sum + p.clientTotalReceived, 0),
      totalProjectCost: projects.reduce((sum, p) => sum + p.contractorTotalPaid, 0),
      monthlyRevenue: [
        { month: 'يناير', revenue: 125000, profit: 35000 },
        { month: 'فبراير', revenue: 148000, profit: 42000 },
        { month: 'مارس',  revenue: 162000, profit: 48000 },
        { month: 'أبريل', revenue: 138000, profit: 38000 },
        { month: 'مايو',  revenue: 175000, profit: 52000 }
      ],
      branchComparison: [
        { branchName: 'فرع الإسكندرية', revenue: 75000, profit: 21000, invoicesCount: 45 },
        { branchName: 'فرع القاهرة',    revenue: 62000, profit: 18000, invoicesCount: 38 },
        { branchName: 'فرع الجيزة',     revenue: 38000, profit: 11000, invoicesCount: 22 }
      ]
    };
  }
};

export { INVOICE_TYPES, PAYMENT_METHODS };
export default api;
```

---

## 5. صفحات التطبيق — التفاصيل الكاملة

### 5.1 صفحة تسجيل الدخول (`Login.jsx`)
**المكونات:**
- Logo + اسم الشركة
- حقل رقم الهاتف (يُستخدم كـ username)
- حقل كلمة المرور
- زر الدخول
- بعد الدخول الناجح: التوجيه حسب الدور (`role`)

**منطق الـ Routing بعد الدخول:**
```
owner       → /owner/dashboard
accountant  → /accountant/dashboard
branch_staff / branch_manager → /branch/dashboard
```

---

### 5.2 لوحة تحكم المالك (`/owner/*`)

#### 5.2.1 `OwnerDashboard.jsx` — الصفحة الرئيسية
**بطاقات الإحصاء (StatCards):**
1. إجمالي قيمة المخزون الكلي
2. إجمالي الديون (من العملاء)
3. إجمالي المستحق للموردين
4. المشاريع النشطة (عدد)
5. إيراد الشهر الحالي
6. صافي الربح هذا الشهر

**المخططات:**
- مخطط خطي (Line Chart): الإيرادات الشهرية + الأرباح (آخر 6 أشهر)
- مخطط أعمدة (Bar Chart): مقارنة الفروع (الإيراد)
- مخطط دائري (Pie Chart): توزيع المبيعات حسب الفئة

**الجداول السريعة:**
- آخر 5 فواتير بيع عبر الفروع
- أعلى 5 منتجات مبيعاً
- تنبيهات المخزون المنخفض

---

#### 5.2.2 `OwnerInventory.jsx` — المخزون الكامل
**الفلاتر:** الفرع | الفئة | البحث بالاسم | الباركود

**الجدول:**
| الكود | اسم المنتج | الفئة | الوحدة | المخزون (B1/B2/B3) | الإجمالي | متوسط التكلفة | سعر البيع | أقل سعر | القيمة الكلية |

**الإجراءات:**
- عرض تفاصيل المنتج
- تعديل الأسعار
- عرض تاريخ الحركة

---

#### 5.2.3 `OwnerEmployees.jsx` — الموظفون
**جدول الموظفين مع:**
- الاسم، الدور، الفرع، الراتب، حالة الراتب الشهر الحالي
- تفاصيل: الرقم القومي، تاريخ التعيين، الهاتف

**إجراءات:**
- إضافة موظف جديد
- تعديل بيانات الموظف
- تسجيل دفع الراتب
- تعطيل/تفعيل الموظف

---

#### 5.2.4 `OwnerProjects.jsx` — المشاريع
**جدول المشاريع:**
| اسم المشروع | العميل | المقاول | قيمة العقد | المستلم | المتبقي من العميل | المدفوع للمقاول | المتبقي للمقاول | الحالة |

**عند الضغط على مشروع — تفاصيله:**
- بيانات المشروع الكاملة
- قسم حسابات العميل (المدفوع والمتبقي)
- قسم حسابات المقاول (المدفوع والمتبقي)
- جدول المواد الصادرة من المخزون للمشروع
- سجل الدفعات (من العميل وللمقاول)

---

#### 5.2.5 `OwnerContractors.jsx` — المقاولون
**جدول المقاولين:**
| اسم المقاول | التخصص | المشاريع | إجمالي العقود | إجمالي المدفوع | المتبقي له |

**عند الضغط على مقاول — بروفايله:**
- بيانات الاتصال
- قائمة مشاريعه مع الشركة
- لكل مشروع: قيمة عقده + المدفوع + المتبقي + الحالة

---

### 5.3 لوحة تحكم المحاسب (`/accountant/*`)

#### 5.3.1 `AccountantSuppliers.jsx` — الموردون
**جدول الموردين:**
| اسم المورد | التخصص | إجمالي المشتريات | المدفوع | المستحق |

**تفاصيل مورد — فاتوره المورد:**
- كل فاتورة شراء: التاريخ، المنتجات، الكميات، القيمة، المدفوع، المتبقي
- إضافة دفعة للمورد
- إضافة فاتورة شراء جديدة (تُضاف للمخزون تلقائياً)

**نموذج إضافة فاتورة شراء:**
```
- اختيار المورد
- اختيار الفرع (الذي ستضاف إليه البضاعة)
- إضافة بنود: منتج + كمية + سعر الوحدة
- إجمالي الفاتورة
- المدفوع الآن (نقدي/شيك/تحويل)
- الباقي (آجل)
- ملاحظات
```

---

#### 5.3.2 `AccountantProjects.jsx` — إدارة المشاريع
**نفس عرض المالك + صلاحية:**
- إضافة مشروع جديد
- تعديل بيانات المشروع
- تسجيل دفعة مستلمة من العميل
- تسجيل دفعة مدفوعة للمقاول
- تغيير حالة المشروع (إكمال/تعليق)

---

#### 5.3.3 `AccountantClients.jsx` — حسابات العملاء
**جدول العملاء الآجلين:**
| اسم العميل | الفرع | إجمالي الديون | الفواتير المفتوحة |

**تفاصيل عميل:**
- كل فاتورة آجلة: رقمها، مبلغها، المدفوع، المتبقي، تاريخ الاستحقاق، الحالة
- إضافة دفعة جديدة تُخصم من الفواتير

---

### 5.4 لوحة تحكم الفرع (`/branch/*`)

#### 5.4.1 `BranchDashboard.jsx`
**إيراد اليوم:**
- نقدي + فيزا + شيكات + الديون المستلمة اليوم = الإجمالي
- عدد الفواتير اليوم
- المبيعات والمرتجعات

**بطاقات سريعة:**
- أعلى 5 منتجات مبيعاً اليوم
- تنبيهات مخزون منخفض في الفرع

---

#### 5.4.2 `BranchInvoices.jsx` — الفواتير
**تبويبات:**
1. **جديد** — إنشاء فاتورة جديدة
2. **سجل الفواتير** — عرض وبحث في الفواتير

**نموذج الفاتورة الجديدة:**
```
نوع الفاتورة:
  ○ بيع نقدي       ○ بيع آجل
  ○ مرتجع مبيعات  ○ إخراج لمشروع
  ○ إذن تحويل

إذا بيع آجل: اختيار العميل أو إضافة جديد + تاريخ الاستحقاق
إذا إخراج لمشروع: اختيار المشروع + المقاول

بنود الفاتورة:
  [بحث منتج] [كمية] [سعر الوحدة*] [الإجمالي] [حذف]
  (* سعر الوحدة يختفي في إذن الإخراج للمشروع)

ملخص:
  المجموع الفرعي: ----
  الخصم: ----
  الإجمالي: ----

طريقة الدفع (في حالة النقدي فقط):
  ○ كاش  ○ فيزا  ○ شيك

[حفظ الفاتورة]  [طباعة]
```

**قواعد التحقق:**
- لا يمكن البيع بأقل من `minSalePrice`
- الكمية يجب ألا تتجاوز المخزون المتاح
- الآجل يتطلب اختيار عميل

---

#### 5.4.3 `BranchInventory.jsx` — المخزون
- عرض مخزون الفرع الحالي مع إجماليات كل الفروع
- بحث وفلترة
- تنبيهات المنخفض

---

#### 5.4.4 `BranchDeferred.jsx` — الآجل
- قائمة العملاء الذين لديهم ديون في هذا الفرع
- فواتيرهم المفتوحة
- إمكانية استلام دفعة (تُسجل في إيراد اليوم)

---

## 6. مكونات مشتركة — التفاصيل

### 6.1 `Sidebar.jsx`
```jsx
// يتغير محتواه حسب الدور
const ownerMenu = [
  { icon: 'speedometer2', label: 'الرئيسية',   path: '/owner/dashboard' },
  { icon: 'boxes',        label: 'المخزون',    path: '/owner/inventory' },
  { icon: 'graph-up',     label: 'المبيعات',   path: '/owner/sales' },
  { icon: 'people',       label: 'الموظفون',   path: '/owner/employees' },
  { icon: 'hammer',       label: 'المشاريع',   path: '/owner/projects' },
  { icon: 'person-badge', label: 'المقاولون',  path: '/owner/contractors' },
  { icon: 'bar-chart',    label: 'التقارير',   path: '/owner/reports' }
];

const accountantMenu = [
  { icon: 'speedometer2',   label: 'الرئيسية',        path: '/accountant/dashboard' },
  { icon: 'truck',          label: 'الموردون',        path: '/accountant/suppliers' },
  { icon: 'cart-plus',      label: 'إضافة مشتريات',   path: '/accountant/purchases' },
  { icon: 'hammer',         label: 'المشاريع',        path: '/accountant/projects' },
  { icon: 'person-badge',   label: 'المقاولون',       path: '/accountant/contractors' },
  { icon: 'people',         label: 'حسابات العملاء',  path: '/accountant/clients' }
];

const branchMenu = [
  { icon: 'speedometer2', label: 'الرئيسية',     path: '/branch/dashboard' },
  { icon: 'receipt',      label: 'الفواتير',     path: '/branch/invoices' },
  { icon: 'boxes',        label: 'المخزون',      path: '/branch/inventory' },
  { icon: 'cash-coin',    label: 'إيراد اليوم',  path: '/branch/revenue' },
  { icon: 'clock-history',label: 'الآجل',        path: '/branch/deferred' }
];
```

### 6.2 `DataTable.jsx`
```jsx
// Props:
{
  columns: [{ key, header, render?, sortable?, width? }],
  data: Array,
  loading: Boolean,
  onRowClick?: Function,
  pagination?: { page, pageSize, total },
  searchable?: Boolean,
  filters?: Array,
  exportable?: Boolean    // تصدير CSV
}
```

### 6.3 `StatCard.jsx`
```jsx
// Props:
{
  title: String,
  value: Number | String,
  prefix?: String,        // مثل "ج.م"
  suffix?: String,
  change?: Number,        // نسبة التغيير %
  icon: String,
  color: 'primary'|'success'|'warning'|'danger'|'info',
  loading?: Boolean
}
```

---

## 7. نظام التوجيه (`router.jsx`)

```jsx
// هيكل الـ Routes:
/                         → Redirect to /login
/login                    → Login.jsx

// Owner Routes (Protected: owner only)
/owner/dashboard          → OwnerDashboard
/owner/inventory          → OwnerInventory
/owner/sales              → OwnerSales
/owner/employees          → OwnerEmployees
/owner/projects           → OwnerProjects
/owner/projects/:id       → OwnerProjectDetail
/owner/contractors        → OwnerContractors
/owner/contractors/:id    → OwnerContractorDetail
/owner/reports            → OwnerReports

// Accountant Routes (Protected: accountant + owner)
/accountant/dashboard     → AccountantDashboard
/accountant/suppliers     → AccountantSuppliers
/accountant/purchases     → AccountantPurchases
/accountant/projects      → AccountantProjects
/accountant/contractors   → AccountantContractors
/accountant/clients       → AccountantClients

// Branch Routes (Protected: branch_staff + branch_manager + accountant + owner)
/branch/dashboard         → BranchDashboard
/branch/invoices          → BranchInvoices
/branch/invoices/new      → SalesInvoiceForm
/branch/inventory         → BranchInventory
/branch/revenue           → BranchDailyRevenue
/branch/deferred          → BranchDeferred
```

---

## 8. سياق المصادقة (`AuthContext.jsx`)

```jsx
// State:
{
  user: {
    id, name, role, branchId,
    permissions: {
      canViewAllBranches: Boolean,
      canManageProjects: Boolean,
      canManageSuppliers: Boolean,
      canViewSalaries: Boolean,
      canCreateInvoices: Boolean,
      canManageContractors: Boolean
    }
  },
  isAuthenticated: Boolean,
  isLoading: Boolean
}

// دالة تحديد الصلاحيات حسب الدور:
const getPermissions = (role) => ({
  owner: {
    canViewAllBranches:    true,
    canManageProjects:     true,
    canManageSuppliers:    true,
    canViewSalaries:       true,
    canCreateInvoices:     true,
    canManageContractors:  true
  },
  accountant: {
    canViewAllBranches:    true,
    canManageProjects:     true,
    canManageSuppliers:    true,
    canViewSalaries:       false,
    canCreateInvoices:     false,
    canManageContractors:  true
  },
  branch_manager: {
    canViewAllBranches:    true,
    canManageProjects:     false,
    canManageSuppliers:    false,
    canViewSalaries:       false,
    canCreateInvoices:     true,
    canManageContractors:  false
  },
  branch_staff: {
    canViewAllBranches:    true,  // عرض فقط
    canManageProjects:     false,
    canManageSuppliers:    false,
    canViewSalaries:       false,
    canCreateInvoices:     true,
    canManageContractors:  false
  }
})[role];
```

---

## 9. أدوات المساعدة (`utils/`)

### `formatters.js`
```javascript
// تنسيق العملة
export const formatCurrency = (amount, decimals = 2) =>
  `${Number(amount).toLocaleString('ar-EG', { minimumFractionDigits: decimals })} ج.م`;

// تنسيق التاريخ بالعربي
export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

// تنسيق الوقت
export const formatDateTime = (dateStr) =>
  new Date(dateStr).toLocaleString('ar-EG');

// تنسيق نوع الفاتورة
export const formatInvoiceType = (type) => ({
  sale:            'بيع نقدي',
  sale_deferred:   'بيع آجل',
  return_sale:     'مرتجع مبيعات',
  return_deferred: 'مرتجع آجل',
  project_issue:   'إخراج لمشروع',
  return_project:  'مرتجع من مشروع',
  transfer:        'تحويل'
}[type] || type);

// تنسيق حالة المشروع
export const formatProjectStatus = (status) => ({
  draft:     { label: 'مسودة',    color: 'secondary' },
  active:    { label: 'نشط',     color: 'success'   },
  completed: { label: 'مكتمل',   color: 'primary'   },
  paused:    { label: 'متوقف',   color: 'warning'   },
  cancelled: { label: 'ملغي',    color: 'danger'    }
}[status]);
```

### `calculations.js`
```javascript
// حساب هامش الربح
export const calcProfitMargin = (salePrice, costPrice) =>
  costPrice > 0 ? ((salePrice - costPrice) / costPrice * 100).toFixed(1) : 0;

// حساب إجمالي الفاتورة
export const calcInvoiceTotal = (items, discount = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  return { subtotal, discount, total: subtotal - discount };
};

// حساب متوسط تكلفة مرجح (Weighted Average Cost)
export const calcWeightedAvgCost = (existingQty, existingCost, newQty, newCost) => {
  const totalQty = existingQty + newQty;
  return totalQty > 0 ? ((existingQty * existingCost) + (newQty * newCost)) / totalQty : newCost;
};
```

---

## 10. تعليمات الـ Dependencies

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "react-bootstrap": "^2.x",
    "bootstrap": "^5.x",
    "recharts": "^2.x",
    "react-icons": "^5.x",
    "date-fns": "^3.x"
  }
}
```

**ملاحظات مهمة:**
- استخدام `react-icons/bs` (Bootstrap Icons) لجميع الأيقونات
- استخدام `recharts` لجميع المخططات
- RTL: إضافة `dir="rtl"` على الـ `<html>` + `lang="ar"` + تضمين خط Cairo من Google Fonts
- لا يوجد backend حقيقي — كل شيء في memory مع محاكاة `setTimeout`

---

## 11. ترتيب تنفيذ الـ Agent

1. **إعداد المشروع**: `create-react-app` أو `vite` + تثبيت الـ dependencies + إعداد RTL
2. **المتغيرات والثيم**: `variables.css` + `global.css` + تحميل الخطوط
3. **Mock API**: إنشاء جميع ملفات البيانات + `index.js`
4. **Utilities**: `formatters.js` + `calculations.js` + `validators.js`
5. **Auth Context**: `AuthContext.jsx` + `useAuth.js`
6. **Layout**: `Sidebar.jsx` + `TopBar.jsx` + Layout wrapper
7. **Common Components**: `StatCard` + `DataTable` + `Modal` + `Badge`
8. **صفحة الدخول**: `Login.jsx`
9. **نظام التوجيه**: `router.jsx` مع Route Guards
10. **Branch Dashboard**: `BranchDashboard.jsx` (الأبسط — للتجربة)
11. **نموذج الفاتورة**: `SalesInvoiceForm.jsx` (الأكثر تعقيداً وأهمية)
12. **باقي صفحات الفرع**: Invoices + Inventory + Revenue + Deferred
13. **لوحة المحاسب**: Suppliers + Projects + Contractors + Clients
14. **لوحة المالك**: Dashboard + جميع الصفحات + Reports

---

*نهاية ملف الخطة — جاهز للـ AI Agent*
