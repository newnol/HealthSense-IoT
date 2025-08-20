# Dashboard Components

Thư mục này chứa các components đã được refactor từ dashboard page để dễ quản lý và maintain hơn.

## Cấu trúc

```
components/Dashboard/
├── DashboardHeader.jsx     # Header với navigation và user info
├── ChartsSection.jsx       # Section chứa biểu đồ Heart Rate và SpO2
├── HealthInsights.jsx      # AI-powered health insights với progress bars
└── README.md              # File này
```

## CSS Modules

Tất cả components sử dụng CSS modules từ `styles/components/dashboard.module.css` với:
- Modern glassmorphism effects
- Gradient backgrounds và animations
- Responsive design
- Micro-interactions

## Components

### DashboardHeader
**Props:**
- `user`: User object với email
- `isAdmin`: Boolean để hiển thị admin panel button
- `onLogout`: Function xử lý logout

**Features:**
- Animated user avatar với first letter
- Navigation buttons với icons và labels
- Responsive design (ẩn labels trên mobile)
- Glassmorphism header với backdrop blur

### ChartsSection
**Props:**
- `records`: Array dữ liệu health records
- `rangeHours`: Number giờ để filter dữ liệu
- `dataLoading`: Boolean trạng thái loading

**Features:**
- Loading state với spinner và text
- Chart cards với glassmorphism
- Real-time status indicators
- Animated chart headers
- No data state với setup button

### HealthInsights
**Props:**
- `records`: Array dữ liệu health records
- `rangeHours`: Number giờ để filter dữ liệu

**Features:**
- AI-powered health analysis
- Progress bars cho heart rate và SpO2
- Color-coded status indicators
- Detailed statistics (avg, min, max)
- Health recommendations
- Disclaimer footer

## Tính năng hiện đại

- ✅ **Glassmorphism Design**: Transparent backgrounds với backdrop blur
- ✅ **Gradient Animations**: Animated gradients cho backgrounds và text
- ✅ **Micro-interactions**: Hover effects, shimmer animations
- ✅ **Progress Indicators**: Animated progress bars cho health metrics
- ✅ **Status Indicators**: Real-time blinking status dots
- ✅ **Responsive Layout**: Mobile-first design
- ✅ **Loading States**: Skeleton loading và spinners
- ✅ **CSS Modules**: Scoped styles
- ✅ **Accessibility**: ARIA labels và semantic HTML

## Animations

- **fadeInUp**: Slide up với fade in
- **slideInLeft/Right**: Slide từ trái/phải
- **heartbeat**: Animation cho health icon
- **blink**: Status indicator animation
- **shimmer**: Hover effect cho cards

## Color Scheme

- **Primary**: Linear gradients (#667eea, #764ba2)
- **Success**: #10b981 (good health status)
- **Warning**: #f59e0b (moderate concern)
- **Danger**: #ef4444 (health alerts)
- **Background**: Linear gradient (#f5f7fa, #c3cfe2)

## Performance

- Memoized calculations trong HealthInsights
- Lazy loading animations
- Optimized CSS với hardware acceleration
- Minimal re-renders với proper dependency arrays
