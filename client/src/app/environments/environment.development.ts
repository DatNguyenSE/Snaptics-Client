export const environment = {
    production: false,
    apiUrl: '/api/',
    // ─── Mock Auth ───────────────────────────────────────────────────────────
    // Bật true để đăng nhập bằng tài khoản mock mà không cần backend.
    // Luôn được bảo vệ: useMockAuth chỉ hoạt động khi production = false.
    useMockAuth: true,
    // ─── Mock Transactions ───────────────────────────────────────────────────
    // Bật true để xem giao diện Transaction với dữ liệu mẫu, không cần backend.
    // Luôn false trên production (xem environment.ts).
    useMockTransactions: true,
};
