# Hướng dẫn sử dụng tính năng Multi-User Devices

## Tổng quan

Tính năng Multi-User Devices cho phép nhiều người dùng cùng chia sẻ một thiết bị đo sức khỏe. Thay vì mỗi thiết bị chỉ có thể liên kết với một người dùng, giờ đây một thiết bị có thể được chia sẻ bởi nhiều thành viên trong gia đình hoặc nhóm.

## Cấu trúc dữ liệu

### Legacy (Single User)
```
/devices/{device_id}/
├── secret: "device_secret"
├── user_id: "single_user_uid"
└── registered_at: timestamp
```

### Multi-User (Mới)
```
/devices/{device_id}/
├── secret: "device_secret"
└── registered_at: timestamp

/device_users/{device_id}/
├── {user_id_1}/
│   ├── registered_at: timestamp
│   └── added_by: "user_who_added_them"
├── {user_id_2}/
│   ├── registered_at: timestamp
│   └── added_by: "user_who_added_them"
└── ...
```

## API Endpoints mới

### 1. Đăng ký thiết bị (Cập nhật)
**POST** `/api/records/device/register`

Tự động chuyển đổi từ single-user sang multi-user khi cần thiết.

### 2. Thêm người dùng vào thiết bị
**POST** `/api/records/device/{device_id}/add-user`

```json
{
  "user_email": "user@example.com",
  "device_secret": "device_secret"
}
```

### 3. Xóa người dùng khỏi thiết bị
**DELETE** `/api/records/device/{device_id}/remove-user/{user_id}`

### 4. Xem danh sách người dùng của thiết bị
**GET** `/api/records/device/{device_id}/users`

Response:
```json
{
  "device_id": "dev123",
  "users": [
    {
      "user_id": "uid1",
      "email": "user1@example.com",
      "registered_at": 1234567890,
      "is_legacy": false,
      "added_by": "uid_who_added"
    }
  ]
}
```

### 5. Xem danh sách thiết bị của người dùng
**GET** `/api/records/user/devices`

Response:
```json
{
  "devices": [
    {
      "device_id": "dev123",
      "registered_at": 1234567890,
      "is_legacy": false,
      "user_count": 3,
      "added_by": "uid_who_added"
    }
  ]
}
```

## Cách sử dụng trên Frontend

### 1. Trang quản lý thiết bị
Truy cập `/device-management` để:
- Xem danh sách thiết bị của bạn
- Xem ai đang sử dụng từng thiết bị
- Thêm người dùng mới vào thiết bị
- Xóa người dùng khỏi thiết bị

### 2. Quy trình chia sẻ thiết bị

1. **Người dùng A** đăng ký thiết bị như bình thường
2. **Người dùng A** vào trang "Quản lý thiết bị"
3. Chọn thiết bị muốn chia sẻ
4. Nhấn "Thêm người dùng mới"
5. Nhập email của **Người dùng B** và mật khẩu thiết bị
6. **Người dùng B** giờ đây có thể xem dữ liệu từ thiết bị đó

## Gửi dữ liệu từ thiết bị

### Với X-User-Id Header (Khuyến nghị)
```bash
curl -X POST http://localhost:8001/api/records/ \
  -H "x-device-id: dev123" \
  -H "x-device-secret: secret123" \
  -H "X-User-Id: specific_user_uid" \
  -H "Content-Type: application/json" \
  -d '{"spo2": 98, "heart_rate": 75}'
```

### Không có X-User-Id (Legacy fallback)
```bash
curl -X POST http://localhost:8001/api/records/ \
  -H "x-device-id: dev123" \
  -H "x-device-secret: secret123" \
  -H "Content-Type: application/json" \
  -d '{"spo2": 98, "heart_rate": 75}'
```

## Script mô phỏng thiết bị

```bash
# Gửi dữ liệu cho người dùng cụ thể
python scripts/simulate_device.py \
  --id dev123 \
  --secret secret123 \
  --user user_uid_here \
  --count 10
```

## Tương thích ngược

Hệ thống hoàn toàn tương thích ngược:
- Thiết bị single-user cũ vẫn hoạt động bình thường
- Khi thêm người dùng thứ 2, hệ thống tự động chuyển sang multi-user
- API cũ vẫn hoạt động như trước

## Bảo mật

- Chỉ người dùng đã đăng ký thiết bị mới có thể thêm người khác
- Cần mật khẩu thiết bị để thêm người dùng mới
- Không thể xóa người dùng cuối cùng khỏi thiết bị
- Mỗi người dùng chỉ thấy được thiết bị mà họ có quyền truy cập

## Lưu ý khi triển khai

1. **Migration**: Thiết bị cũ sẽ được tự động migrate khi có người dùng thứ 2 được thêm vào
2. **Performance**: Với nhiều thiết bị và người dùng, nên cân nhắc indexing cho `/device_users`
3. **UI/UX**: Giao diện rõ ràng phân biệt giữa legacy và multi-user devices
4. **Monitoring**: Theo dõi số lượng shared devices để hiểu usage patterns

## Ví dụ thực tế

### Gia đình 4 người
- **Bố** đăng ký thiết bị `family_device_001`
- **Bố** thêm **Mẹ**, **Con 1**, **Con 2** vào thiết bị
- Mỗi người có thể xem dữ liệu sức khỏe của cả gia đình
- Thiết bị gửi dữ liệu với `X-User-Id` tương ứng với người đang sử dụng

### Phòng gym
- **Quản lý** đăng ký nhiều thiết bị
- **Quản lý** thêm các **Trainer** vào từng thiết bị
- **Trainer** có thể xem dữ liệu khách hàng từ thiết bị được phân công
