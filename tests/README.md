# Tests cho HealthSense-IoT API

Thư mục này chứa các test cases để kiểm tra tất cả các chức năng API của HealthSense-IoT.

## Cấu trúc

```
tests/
├── __init__.py              # Package init
├── conftest.py              # Cấu hình test chung và fixtures
├── pytest.ini              # Cấu hình pytest
├── requirements.txt         # Dependencies cho testing
├── README.md               # Tài liệu này
├── test_auth.py            # Tests cho authentication
├── test_records.py         # Tests cho health records
├── test_profile.py         # Tests cho user profiles  
├── test_ai.py              # Tests cho AI chat và summarize
├── test_admin.py           # Tests cho admin functions
├── test_command.py         # Tests cho device commands
└── test_login.py           # Tests cho login endpoint
```

## Cài đặt

1. Cài đặt dependencies:
```bash
pip install -r tests/requirements.txt
```

2. Thiết lập biến môi trường test (tạo `.env.test`):
```bash
# Firebase config (có thể dùng test project)
FIREBASE_DB_URL=https://test-project.firebaseio.com
FIREBASE_PROJECT_ID=test-project
# ... các biến Firebase khác

# Google AI
GOOGLE_API_KEY=your_test_api_key

# Firebase Web API
NEXT_PUBLIC_FIREBASE_API_KEY=your_web_api_key
```

## Chạy tests

### Chạy tất cả tests:
```bash
pytest
```

### Chạy test cho module cụ thể:
```bash
pytest tests/test_auth.py
pytest tests/test_records.py
```

### Chạy test với coverage:
```bash
pytest --cov=api --cov-report=html
```

### Chạy test cụ thể:
```bash
pytest tests/test_auth.py::TestAuthEndpoints::test_verify_token_success
```

### Chạy test với output chi tiết:
```bash
pytest -v -s
```

## Các loại test

### 1. Authentication Tests (`test_auth.py`)
- Xác minh token Firebase
- Quản lý user roles và admin claims
- Lấy thông tin user

### 2. Records Tests (`test_records.py`)
- Submit dữ liệu sức khỏe từ device
- Lấy records của user
- Đăng ký và quản lý devices
- Chia sẻ device giữa users

### 3. Profile Tests (`test_profile.py`)
- Tạo, cập nhật, xóa profile user
- Validation dữ liệu profile
- Quản lý timezone

### 4. AI Tests (`test_ai.py`)
- Chat với AI về sức khỏe
- Tạo summary tự động
- Quản lý chat sessions và memory

### 5. Admin Tests (`test_admin.py`)
- Quản lý users (CRUD)
- Quản lý devices
- Thống kê hệ thống

### 6. Command Tests (`test_command.py`)
- Gửi lệnh đến devices
- Xác thực device credentials

### 7. Login Tests (`test_login.py`)
- Đăng nhập với email/password
- Xử lý lỗi authentication

## Mocking

Tests sử dụng mocking để:
- Mock Firebase Admin SDK
- Mock Google Generative AI
- Mock HTTP requests
- Tránh phụ thuộc vào services thật

## Coverage

Target coverage: ≥80%

Xem coverage report:
```bash
pytest --cov=api --cov-report=html
open htmlcov/index.html
```

## Best Practices

1. **Isolation**: Mỗi test độc lập, không phụ thuộc vào test khác
2. **Mocking**: Mock tất cả external dependencies
3. **Clear naming**: Tên test mô tả rõ ràng scenario
4. **Arrange-Act-Assert**: Cấu trúc test rõ ràng
5. **Edge cases**: Test cả happy path và error cases

## Troubleshooting

### Lỗi import module
```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Lỗi Firebase mock
Kiểm tra fixtures trong `conftest.py` có được import đúng không.

### Test chạy chậm
Sử dụng marker để skip slow tests:
```bash
pytest -m "not slow"
```

## Continuous Integration

Có thể tích hợp với GitHub Actions:
```yaml
- name: Run tests
  run: |
    pip install -r tests/requirements.txt
    pytest --cov=api --cov-report=xml
```
