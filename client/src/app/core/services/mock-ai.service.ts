import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { ChatMessage, AnalysisData } from './chat-storage.service';

@Injectable({
  providedIn: 'root',
})
export class MockAiService {
  /**
   * Generates a mock AI response based on keyword matching
   */
  generateResponse(
    content: string,
    dataRange: string,
    conversationId: string,
    hasAttachment = false
  ): Observable<Partial<ChatMessage>> {
    const text = content.toLowerCase();
    let reply = '';
    let analysisData: AnalysisData | undefined;

    if (hasAttachment) {
      reply =
        'Mình đã nhận được hình ảnh hóa đơn/tài liệu đính kèm của bạn! Dựa trên hình ảnh, đây là thông tin chi tiết:\n\n**Hóa đơn thanh toán WinMart**\n- **Ngày giao dịch**: 19/07/2026\n- **Cửa hàng**: WinMart Landmark 81\n- **Mặt hàng**: Thực phẩm tươi sống, sữa, trái cây và gia vị.\n- **Tổng cộng**: 345.000đ\n\nMình đã tự động thêm hóa đơn này vào danh sách giao dịch nháp của bạn. Bạn có muốn chuyển mục này thành giao dịch chính thức không?';
      analysisData = {
        currentAmount: 345000,
        topCategory: 'Hóa đơn',
      };
    } else if (text.includes('tuần')) {
      reply =
        'Dữ liệu chi tiêu tuần này của bạn ghi nhận mức giảm tích cực **-15%** so với tuần trước. Chi phí ăn uống tại các quán ăn ngoài giảm mạnh nhờ bạn tự nấu ăn, tuy nhiên chi phí đổ xăng/grabcar có tăng nhẹ.\n\nĐây là bảng phân bổ chi tiết các mục chi lớn nhất tuần này:';
      analysisData = {
        currentAmount: 1850000,
        previousAmount: 2176000,
        percentageChange: -15,
        topCategory: 'Ăn uống',
        categories: [
          { name: 'Ăn uống', amount: 720000 },
          { name: 'Di chuyển', amount: 380000 },
          { name: 'Mua sắm', amount: 450000 },
          { name: 'Hóa đơn', amount: 300000 },
        ],
      };
    } else if (text.includes('tháng')) {
      reply =
        'Tổng chi tiêu tháng này của bạn đạt **16.540.000đ**, tăng **8%** so với tháng trước (15.314.000đ). Mục chi tiêu thúc đẩy sự gia tăng này là việc sắm sửa các thiết bị làm việc mới trên Shopee và một số buổi liên hoan cuối tuần với bạn bè.\n\nDưới đây là chi tiết so sánh các danh mục tiêu dùng chính:';
      analysisData = {
        currentAmount: 16540000,
        previousAmount: 15314000,
        percentageChange: 8,
        topCategory: 'Mua sắm',
        categories: [
          { name: 'Ăn uống', amount: 5280000 },
          { name: 'Nhà ở', amount: 4500000 },
          { name: 'Di chuyển', amount: 2650000 },
          { name: 'Mua sắm', amount: 2100000 },
          { name: 'Hóa đơn', amount: 1300000 },
          { name: 'Giải trí', amount: 710000 },
        ],
      };
    } else if (text.includes('ăn uống')) {
      reply =
        'Danh mục **Ăn uống** của bạn chiếm tỷ trọng cao nhất trong các nhóm chi tiêu tự do (**32% tổng chi tiêu** trong tháng này). Bạn đã tiêu tổng cộng **5.280.000đ** cho các bữa ăn bên ngoài và đặt GrabFood.\n\nKhoản chi lớn nhất là bữa tiệc cùng đồng nghiệp tại Cơm niêu Sài Gòn (5.280.000đ). Để tiết kiệm, bạn có thể tự nấu cơm trưa mang đi làm, giúp giảm tới 1.500.000đ mỗi tháng.';
      analysisData = {
        currentAmount: 5280000,
        previousAmount: 4800000,
        percentageChange: 10,
        topCategory: 'Ăn uống',
        categories: [
          { name: 'GrabFood ăn trưa', amount: 180000 },
          { name: 'Cà phê Highlands', amount: 65000 },
          { name: 'Liên hoan Cơm niêu', amount: 5035000 },
        ],
      };
    } else if (text.includes('ngân sách')) {
      reply =
        'Dựa trên dòng tiền cá nhân hiện tại của bạn, đây là đề xuất thiết lập ngân sách tháng phù hợp giúp duy trì tỷ lệ tiết kiệm **20%**:\n\n- **Ngân sách Ăn uống**: Giới hạn **6.000.000đ** (Hiện đã dùng 88%).\n- **Ngân sách Di chuyển**: Giới hạn **3.500.000đ** (Hiện đã dùng 76%).\n- **Ngân sách Mua sắm**: Giới hạn **2.000.000đ** (Hiện đã vượt **100.000đ**!).\n- **Ngân sách Giải trí**: Giới hạn **2.500.000đ** (Còn dư nhiều).\n\nBạn nên thắt chặt hầu bao cho việc mua sắm thiết bị/quần áo cuối tháng này để không thâm hụt tài chính.';
      analysisData = {
        currentAmount: 14000000,
        previousAmount: 14100000,
        percentageChange: -0.7,
        topCategory: 'Ngân sách',
        categories: [
          { name: 'Ăn uống', amount: 6000000 },
          { name: 'Di chuyển', amount: 3500000 },
          { name: 'Mua sắm', amount: 2000000 },
          { name: 'Giải trí', amount: 2500000 },
        ],
      };
    } else if (text.includes('tiết kiệm')) {
      reply =
        'Để cải thiện quỹ tiết kiệm ròng tháng này, Snaptics AI đề xuất các hành động thiết thực sau:\n\n1. **Giảm 10% ăn uống ngoài**: Nấu cơm mang đi làm 3 buổi/tuần có thể giúp tiết kiệm ngay **500.000đ** mỗi tháng.\n2. **Tối ưu hóa phí dịch vụ định kỳ**: Bạn đang trả **450.000đ/tháng** cho California Gym nhưng dữ liệu Check-in chỉ 2 lần/tháng. Hãy cân nhắc hạ gói cước.\n3. **Quy tắc Shopee 48h**: Trì hoãn thanh toán giỏ hàng Shopee 48 tiếng để giảm bớt 70% các khoản mua sắm bộc phát.\n\nNếu thực hiện tốt, bạn sẽ dư ra khoảng **1.800.000đ** để bổ sung vào tài khoản tiết kiệm.';
      analysisData = {
        currentAmount: 1800000,
        topCategory: 'Tiết kiệm gợi ý',
      };
    } else if (text.includes('bất thường')) {
      reply =
        'Mình phát hiện một giao dịch có giá trị **bất thường vượt trội** so với lịch sử chi tiêu trung bình của bạn:\n\n- **Giao dịch**: Liên hoan Cơm niêu Sài Gòn\n- **Giá trị**: **5.280.000đ**\n- **Ngày**: 17/07/2026\n- **Hình thức**: Quét thẻ Visa\n\nKhoản chi này gấp tới 35 lần chi phí ăn trưa thông thường của bạn (khoảng 150.000đ). Nếu đây là khoản chi tiếp khách hoặc thanh toán chung, hãy ghi chú lại để loại trừ khi tính toán chỉ số chi tiêu cá nhân.';
      analysisData = {
        currentAmount: 5280000,
        previousAmount: 150000,
        percentageChange: 3420,
        topCategory: 'Giao dịch lớn',
      };
    } else if (text.includes('hóa đơn')) {
      reply =
        'Hệ thống ghi nhận bạn đã quét thành công hóa đơn gần đây tại **WinMart** trị giá **1.250.000đ** vào ngày 13/07/2026. Hóa đơn này đã được phân loại vào danh sách Giao dịch quét.\n\nNgoài ra, bạn còn **3 hóa đơn định kỳ sắp đến hạn** thanh toán trong tuần này:\n1. **Internet Viettel**: 300.000đ (Hạn 25 hàng tháng)\n2. **Netflix Subscription**: 260.000đ (Hạn 27 hàng tháng)\n3. **Spotify Premium**: 59.000đ (Hạn 29 hàng tháng)';
      analysisData = {
        currentAmount: 1250000,
        categories: [
          { name: 'Hóa đơn WinMart', amount: 1250000 },
          { name: 'Internet Viettel', amount: 300000 },
          { name: 'Netflix', amount: 260000 },
          { name: 'Spotify Premium', amount: 59000 },
        ],
      };
    } else {
      reply =
        'Chào bạn! Mình là Roni, trợ lý AI tài chính cá nhân của Snaptics. Mình có thể hỗ trợ bạn:\n\n- **Phân tích chi tiêu**: Nhận xét biến động tuần này, tháng này hoặc theo danh mục.\n- **Kiểm tra ngân sách**: Nhắc nhở các khoản chi tiêu quá giới hạn.\n- **Gợi ý tiết kiệm**: Cách tối ưu hóa các khoản phí định kỳ và ăn uống.\n- **Phân tích hóa đơn**: Đọc hóa đơn mua sắm siêu thị hoặc hóa đơn dịch vụ.\n\nBạn có thể hỏi những câu như *"Tôi đã tiêu bao nhiêu tuần này?"* hoặc *"Gợi ý tiết kiệm tháng sau"* nhé!';
    }

    const mockResponse: Partial<ChatMessage> = {
      id: 'msg_' + Math.random().toString(36).substring(2, 11),
      conversationId,
      role: 'assistant',
      content: reply,
      createdAt: new Date().toISOString(),
      status: 'completed',
      analysisData,
    };

    // Return response with 1 to 1.5 seconds mock delay
    const delayMs = 1000 + Math.random() * 500;
    return of(mockResponse).pipe(delay(delayMs));
  }
}
