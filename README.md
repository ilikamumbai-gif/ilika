src/
├── admin/
│   ├── components/        # Reusable admin UI components
│   │   ├── AdminSidebar.jsx
│   │   ├── AdminHeader.jsx
│   │   ├── AdminLayout.jsx
│   │   ├── StatCard.jsx
│   │   └── AdminTable.jsx
│   │
│   ├── pages/             # Admin screens (routes)
│   │   ├── Dashboard.jsx
│   │   ├── Products/
│   │   │   ├── ProductList.jsx
│   │   │   ├── AddProduct.jsx
│   │   │   └── EditProduct.jsx
│   │   │
│   │   ├── Categories/
│   │   │   ├── CategoryList.jsx
│   │   │   └── AddCategory.jsx
│   │   │
│   │   ├── Orders/
│   │   │   ├── OrderList.jsx
│   │   │   └── OrderDetail.jsx
│   │   │
│   │   └── Users/
│   │       ├── UserList.jsx
│   │       └── UserDetail.jsx
│   │
│   ├── routes/            # Admin routing
│   │   └── AdminRoutes.jsx
│   │
│   ├── services/          # API calls (admin only)
│   │   ├── productService.js
│   │   ├── categoryService.js
│   │   ├── orderService.js
│   │   └── userService.js
│   │
│   ├── hooks/             # Admin hooks
│   │   ├── useAdminAuth.js
│   │   └── useAdminStats.js
│   │
│   ├── utils/             # Helpers (reuse middleware logic)
│   │   └── categoryMapper.js
│   │
│   ├── styles/            # Admin-specific styles
│   │   └── admin.css
│   │
│   └── index.js           # Admin exports
│
├── components/            # User-facing components
├── pages/
├── context/
├── utils/
└── App.jsx
