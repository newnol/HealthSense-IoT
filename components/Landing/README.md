# Landing Page Components

Thư mục này chứa các components đã được refactor từ landing page để dễ quản lý và maintain hơn.

## Cấu trúc

```
components/Landing/
├── Header.jsx              # Header với logo và nút đăng nhập
├── HeroSection.jsx         # Hero section với gradient effects và device mockup
├── StatsSection.jsx        # Section thống kê với animated numbers
├── FeaturesSection.jsx     # Grid các tính năng nổi bật
├── TestimonialsSection.jsx # Testimonials từ người dùng
├── CTASection.jsx          # Call-to-action section
├── Footer.jsx              # Footer với thông tin liên hệ
└── README.md               # File này
```

## CSS Modules

Tất cả components sử dụng CSS modules từ `styles/components/landing.module.css` để:
- Tránh conflict CSS class names
- Dễ maintain và debug
- Tối ưu performance

## Props

### Header
- `onShowAuthModal`: Function để hiển thị modal đăng nhập

### HeroSection  
- `onShowAuthModal`: Function để hiển thị modal đăng nhập

### CTASection
- `onShowAuthModal`: Function để hiển thị modal đăng nhập

### Các components khác
Không cần props, tự render dữ liệu tĩnh.

## Animations

Tất cả components sử dụng `AnimatedElement` từ `../AnimatedElement` với:
- `fadeInUp`: Animation từ dưới lên
- `scaleIn`: Animation scale từ nhỏ đến lớn
- `trigger="onScroll"`: Trigger animation khi scroll vào viewport

## Tính năng

- ✅ Responsive design
- ✅ Glassmorphism effects  
- ✅ Animated counters
- ✅ Particle system
- ✅ Gradient animations
- ✅ Micro-interactions
- ✅ CSS modules
- ✅ Component-based architecture
