# Tính năng Xóa Người dùng - Admin API

## Tổng quan
Tính năng xóa người dùng cho phép admin xóa hoàn toàn một tài khoản người dùng khỏi hệ thống, bao gồm tất cả dữ liệu liên quan.

## API Endpoint

### DELETE `/api/admin/users/{user_id}`

**Quyền truy cập:** Chỉ Admin

**Mô tả:** Xóa người dùng và tất cả dữ liệu liên quan

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Response thành công:**
```json
{
  "status": "success",
  "message": "User deleted successfully. Devices unregistered and data cleaned up.",
  "deletedData": {
    "devicesUnregistered": 2,
    "recordsDeleted": 150,
    "userEmail": "user@example.com"
  }
}
```

**Response lỗi:**
- `404`: Người dùng không tồn tại
- `400`: Không thể xóa tài khoản của chính mình
- `403`: Không thể xóa tài khoản admin khác / Không có quyền admin
- `500`: Lỗi server

## Dữ liệu được xóa và thay đổi

Khi xóa người dùng, hệ thống sẽ:

### Xóa hoàn toàn:
1. **Tài khoản Firebase Auth** - Xóa hoàn toàn user khỏi Firebase
2. **Bản ghi dữ liệu** - Tất cả dữ liệu sức khỏe từ thiết bị
3. **Hồ sơ người dùng** - Thông tin profile và cài đặt
4. **Phiên đăng nhập** - Các session đang hoạt động
5. **Tùy chọn** - Cài đặt cá nhân của user

### Hủy đăng ký (không xóa):
1. **Thiết bị** - Hủy đăng ký user khỏi thiết bị nhưng giữ lại thiết bị
2. **Trạng thái thiết bị** - Chuyển sang "unregistered"
3. **Khả năng tái sử dụng** - Thiết bị có thể đăng ký lại với user khác

## Bảo mật

- **Xác thực Admin:** Chỉ admin mới có thể xóa người dùng
- **Tự bảo vệ:** Admin không thể xóa tài khoản của chính mình
- **Bảo vệ Admin:** Không thể xóa tài khoản admin khác
- **Logging:** Tất cả hoạt động xóa đều được ghi log chi tiết
- **Xác nhận:** Frontend yêu cầu xác nhận trước khi xóa

## Sử dụng trong Frontend

### 1. Hiển thị danh sách người dùng
```jsx
<UsersManagement
  users={users}
  onDeleteUser={handleDeleteUser}
  // ... other props
/>
```

### 2. Xử lý xóa người dùng
```jsx
const handleDeleteUser = async (userId) => {
  try {
    const result = await deleteUser(userId)
    // Hiển thị thông báo thành công
    alert(`Đã xóa người dùng thành công!`)
    // Refresh dữ liệu
    fetchUsers()
  } catch (error) {
    // Xử lý lỗi
    alert('Lỗi khi xóa người dùng: ' + error.message)
  }
}
```

### 3. Modal xác nhận
- Hiển thị thông tin người dùng sẽ bị xóa
- Yêu cầu xác nhận từ admin
- Hiển thị loading state khi đang xóa
- Thông báo kết quả sau khi hoàn thành

## Logging và Monitoring

Tất cả hoạt động xóa người dùng đều được ghi log:

- **Info:** Bắt đầu quá trình xóa, tìm thấy user, hoàn thành xóa
- **Warning:** Không thể xóa một số dữ liệu phụ
- **Error:** Lỗi nghiêm trọng trong quá trình xóa

## Xử lý lỗi

### Lỗi thường gặp:
1. **User not found:** Người dùng đã bị xóa trước đó
2. **Permission denied:** Token admin không hợp lệ
3. **Self-deletion:** Admin cố gắng xóa chính mình
4. **Database errors:** Lỗi khi cleanup dữ liệu

### Khôi phục dữ liệu:
- **Không thể hoàn tác:** Việc xóa người dùng là vĩnh viễn
- **Backup:** Cần có backup dữ liệu trước khi xóa
- **Audit trail:** Log ghi lại tất cả hoạt động để kiểm tra

## Testing

### Test cases cần kiểm tra:
1. ✅ Xóa người dùng thường thành công
2. ✅ Xóa người dùng có nhiều thiết bị
3. ✅ Xóa người dùng có nhiều dữ liệu
4. ✅ Ngăn chặn xóa tài khoản admin
5. ✅ Xử lý lỗi khi user không tồn tại
6. ✅ Xử lý lỗi database
7. ✅ Logging đầy đủ

## Cải tiến tương lai

1. **Soft delete:** Thay vì xóa hoàn toàn, có thể ẩn user
2. **Batch deletion:** Xóa nhiều user cùng lúc
3. **Recovery options:** Khôi phục user trong thời gian nhất định
4. **Advanced filtering:** Lọc user theo tiêu chí trước khi xóa
5. **Notification system:** Thông báo cho admin khác khi có user bị xóa

## Lưu ý quan trọng

⚠️ **CẢNH BÁO:** Việc xóa người dùng là **KHÔNG THỂ HOÀN TÁC** và sẽ xóa **TẤT CẢ** dữ liệu liên quan.

- Luôn xác nhận kỹ trước khi xóa
- Kiểm tra user có thực sự cần xóa không
- Backup dữ liệu quan trọng trước khi xóa
- Chỉ admin mới có quyền thực hiện thao tác này
