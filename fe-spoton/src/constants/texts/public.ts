export const PUBLIC_TEXTS = {
  branches: {
    header: {
      breadcrumbs: {
        home: "Trang chủ",
        current: "Chi nhánh tại Cần Thơ"
      },
      titleLoading: "Đang tải...",
      title: "Chi nhánh",
      subtitle: "Danh sách các chi nhánh SpotOn đang hoạt động."
    },
    filters: {
      title: "Bộ lọc",
      clearAll: "Xóa tất cả",
      district: {
        label: "Quận / Huyện",
        all: "Tất cả quận"
      },
      status: {
        label: "Trạng thái",
        all: "Tất cả",
        open: "Đang mở",
        full: "Đã đầy",
        closed: "Đã đóng"
      },
      guests: {
        label: "Số lượng khách",
        any: "Bất kỳ",
        unit: "Khách"
      },
      amenities: {
        label: "Khu vực ưa thích",
        empty: "Chưa có dữ liệu tiện ích",
        showLess: "Ẩn bớt",
        showMore: "Xem thêm",
        moreUnit: "tiện ích"
      },
      applyBtn: "Áp dụng bộ lọc"
    },
    list: {
      loading: "Đang tải danh sách chi nhánh...",
      notFound: {
        title: "Không tìm thấy chi nhánh",
        desc: "Vui lòng thử thay đổi điều kiện tìm kiếm."
      }
    },
    card: {
      noAddress: "Chưa cập nhật địa chỉ",
      defaultCity: "Cần Thơ",
      openTime: "Giờ mở cửa:",
      noServiceTime: "Chưa cập nhật giờ",
      capacity: "Sức chứa tối đa:",
      noCapacity: "Chưa cập nhật",
      bookBtn: "Đặt bàn ngay",
      viewBtn: "Xem chi tiết",
      ratingFallback: "0 đánh giá",
      priceFallback: "Liên hệ",
      priceUnit: "khách"
    }
  },
  branchDetail: {
    backBtn: "Quay lại danh sách",
    hero: {
      capacity: "người lớn",
      statusOpen: "ĐANG MỞ CỬA",
      statusClosed: "ĐÃ ĐÓNG CỬA",
      ratingFallback: "Chưa có đánh giá",
      priceUnit: "khách"
    },
    tabs: {
      overview: "Tổng quan",
      menu: "Thực đơn",
      photos: "Hình ảnh",
      reviews: "Đánh giá"
    },
    overview: {
      about: "Về chi nhánh",
      aboutDescFallback: "Chi nhánh này chưa có mô tả. Tuy nhiên, chúng tôi luôn cam kết mang lại không gian sang trọng và dịch vụ đẳng cấp nhất cho quý khách. Kính mời quý khách đến trải nghiệm thực đơn đa dạng và không gian tuyệt vời tại chi nhánh này.",
      amenities: "Tiện ích nổi bật",
      noAmenities: "Chi nhánh đang cập nhật tiện ích.",
      map: "Bản đồ & Vị trí",
      address: "Địa chỉ",
      addressFallback: "Chưa có địa chỉ chi tiết",
      contact: "Liên hệ & Giờ mở cửa",
      hotline: "Hotline",
      hotlineFallback: "Đang cập nhật",
      serviceHours: "Giờ phục vụ",
      lunch: "Trưa",
      dinner: "Tối"
    },
    },
    bookingTab: {
      step1: "1. Chọn thời gian & số người",
      step1Desc: "Vui lòng chọn thông tin để hệ thống tìm bàn trống phù hợp.",
      date: "Ngày đến",
      time: "Giờ đến",
      guests: "Số khách",
      checkBtn: "Tìm bàn trống",
      checkingBtn: "Đang kiểm tra...",
      step2: "2. Chọn sơ đồ bàn",
      selectedCount: "Đã chọn:",
      capacity: "Sức chứa:",
      noZone: "Chi nhánh này chưa có sơ đồ bàn.",
      tableStatus: {
        available: "Trống",
        booked: "Đã đặt",
        selected: "Đang chọn"
      },
      legend: {
        title: "Chú thích",
        available: "Bàn trống",
        booked: "Đã đặt / Đang có khách",
        selected: "Đang chọn"
      },
      holdBtn: "Giữ bàn & Điền thông tin",
      holdingBtn: "Đang giữ bàn...",
      limitAlert: "Chỉ được chọn tối đa 4 bàn. Nếu bạn đi nhóm đông, vui lòng gọi Hotline.",
      capacityAlert: "Cảnh báo: Bàn bạn chọn chỉ chứa được {capacity} người, nhưng bạn đi {guests} người. Sẽ rất chật chội. Bạn có chắc chắn muốn tiếp tục?"
    },
    checkout: {
      success: {
        title: "Đặt bàn thành công!",
        desc: "Cảm ơn bạn. Thông tin đặt bàn và món ăn đã được ghi nhận.",
        backBtn: "Trở về Trang chủ chi nhánh"
      },
      timer: {
        label: "Thời gian giữ bàn còn lại",
        cancelBtn: "Hủy đặt bàn",
        timeoutAlert: "Đã hết thời gian giữ bàn. Vui lòng chọn lại bàn từ đầu."
      },
      menu: {
        title: "Chọn món trước (Không bắt buộc)",
        loading: "Đang tải thực đơn hoặc chi nhánh chưa có thực đơn...",
        addBtn: "Thêm món",
        outOfStock: "Đã Hết",
        priceContact: "Liên hệ",
        noCategoryName: "Danh mục món",
        noItemName: "Tên món"
      },
      cart: {
        title: "Giỏ hàng của bạn",
        empty: "Bạn chưa chọn món nào.",
        total: "Tổng tiền món:"
      },
      form: {
        title: "Thông tin liên hệ",
        nameLabel: "Họ tên người đặt",
        namePlaceholder: "Nhập tên của bạn",
        phoneLabel: "Số điện thoại",
        phonePlaceholder: "Ví dụ: 0912345678",
        noteLabel: "Ghi chú (Tùy chọn)",
        notePlaceholder: "Ghi chú thêm...",
        submitBtn: "Hoàn Tất Đặt Bàn",
        submittingBtn: "Đang xử lý...",
        errors: {
          nameMin: "Tên phải có ít nhất 2 ký tự",
          nameMax: "Tên không được quá 50 ký tự",
          phoneInvalid: "Số điện thoại không hợp lệ",
          noteMax: "Ghi chú không được quá 200 ký tự"
        }
      }
    },
    menuTab: {
      empty: "Chi nhánh này hiện chưa có thực đơn.",
      title: "Thực đơn SpotOn",
      subtitle: "Khám phá các món ăn đặc sắc được phục vụ tại chi nhánh của chúng tôi.",
      noCategoryName: "Danh mục món",
      outOfStock: "Đã Hết",
      noItemName: "Tên món",
      priceContact: "Liên hệ",
      noDesc: "Chưa có mô tả cho món này.",
      emptyCategory: "Chưa có món ăn trong danh mục này."
    },
    vouchersTab: {
      empty: "Hiện tại chưa có ưu đãi nào khả dụng.",
      title: "Ưu đãi nổi bật",
      subtitle: "Áp dụng các ưu đãi này khi bạn đặt bàn để nhận mức giá tốt nhất.",
      codeFallback: "MÃ KM",
      nameFallback: "Khuyến mãi SpotOn",
      descFallback: "Áp dụng cho mọi hóa đơn.",
      expiry: "HSD:",
      noExpiry: "Không thời hạn",
      copyBtn: "Sao chép mã"
    },
    map: {
      zoneClosed: "Đóng",
      branchClosed: {
        title: "Quán đang đóng cửa",
        desc: "Rất xin lỗi, chi nhánh {branchName} hiện đang tạm dừng nhận khách. Quý khách vui lòng quay lại sau hoặc chọn chi nhánh khác!"
      },
      zoneClosedDetail: {
        title: "Khu vực đang tạm đóng",
        desc: "Khu vực này hiện đang tạm thời đóng cửa (do thời tiết hoặc đang bảo trì). Vui lòng chọn một khu vực khác để tiếp tục đặt bàn."
      }
    },
    mapSidebar: {
      defaultName: "SpotOn Chi nhánh",
      loadingAddress: "Đang tải địa chỉ...",
      serving: "Đang phục vụ",
      filterTitle: "CHỌN THEO SỐ LƯỢNG KHÁCH",
      distanceTitle: "QUY TẮC KHOẢNG CÁCH",
      mainAisle: "Lối đi chính: 120 - 150 cm",
      subAisle: "Lối đi phụ: 90 - 110 cm",
      wallDistance: "Tường / Vật cản: ≥ 60 cm",
      occupancyTitle: "TỈ LỆ LẤP ĐẦY",
      refreshedNow: "Refreshed just now",
      capacities: {
        2: { label: "2 NGƯỜI", details: "60×60 cm / 70×70 cm" },
        4: { label: "4 NGƯỜI", details: "120×80 cm / 110×110 cm" },
        6: { label: "6 NGƯỜI", details: "160×80 cm / 140×140 cm" },
        8: { label: "8 NGƯỜI", details: "200×100 cm / Ø 160 cm" }
      }
    }
};
