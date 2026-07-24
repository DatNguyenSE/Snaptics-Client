export const environment = {
    production: false,
    apiUrl: '/api/',
    // khi dev phải dùng /api để tránh lỗi CORS, khi build sẽ tự động đổi thành http://
    // ─── Mock Auth ───────────────────────────────────────────────────────────
    // Bật true để đăng nhập bằng tài khoản mock mà không cần backend.
    // Luôn được bảo vệ: useMockAuth chỉ hoạt động khi production = false.
    useMockAuth: false,
    // ─── Mock Transactions ───────────────────────────────────────────────────
    // Bật true để xem giao diện Transaction với dữ liệu mẫu, không cần backend.
    // Luôn false trên production (xem environment.ts).
    useMockTransactions: false,
};
