export const CAROUSEL_ANIMATION_DURATION_MS = 450;
export const CAROUSEL_SNAP_RESTORE_DELAY_MS = 400;
export const CAROUSEL_DEFAULT_CARD_WIDTH = 300;
export const CAROUSEL_GAP = 16;
export const CAROUSEL_DRAG_THRESHOLD_PX = 4;

export const DASHBOARD_RESUME_PREVIEW_ITEMS = 5;
export const DASHBOARD_RECENT_ITEMS = 3;
export const DASHBOARD_COPY = {
  en: {
    welcome: "Welcome back, ready for your next step?",
    intro: "A little practice today. More confidence on exam day.",
    next: "Task types in progress",
    nextHint: "Your latest unfinished session for each task type.",
    resumeLatest: "Most recent", resumeAll: "View all", resumeCollapse: "Show less",
    resumeFilterEmpty: "No task practice in progress for this skill.",
    tasks: "Practise by task type", tasksHint: "Choose a question type and focus on the task you want to improve.", allTasks: "All task types",
    plan: "Your exam, your pace", planHint: "Set your exam date to keep your preparation in view.",
    recent: "Recent activity", empty: "Your first session starts here.",
    emptyHint: "Choose a task type below. Your activity will appear as you practise.",
    questions: "Available questions", answered: "Questions answered",
    loading: "Loading your latest sessions…", error: "Your recent sessions could not be loaded.",
    browse: "Explore task types", continue: "Continue practising", progress: "Answered",
    total: "questions available", taskTypes: "task types", viewProgress: "View progress",
  },
  vi: {
    welcome: "Chào bạn, sẵn sàng tiến thêm một bước?",
    intro: "Luyện tập một chút hôm nay. Tự tin hơn trong ngày thi.",
    next: "Dạng bài đang làm",
    nextHint: "Tiếp tục phiên luyện tập gần nhất của từng dạng bài.",
    resumeLatest: "Gần đây nhất", resumeAll: "Xem tất cả", resumeCollapse: "Thu gọn",
    resumeFilterEmpty: "Chưa có dạng bài đang làm thuộc kỹ năng này.",
    tasks: "Luyện tập theo dạng bài", tasksHint: "Chọn dạng câu hỏi và tập trung cải thiện từng phần bạn cần.", allTasks: "Tất cả dạng bài",
    plan: "Chuẩn bị cho ngày thi", planHint: "Đặt ngày thi để theo dõi kế hoạch chuẩn bị của bạn.",
    recent: "Hoạt động gần đây", empty: "Bắt đầu hành trình của bạn",
    emptyHint: "Chọn một dạng bài bên dưới. Hoạt động sẽ xuất hiện khi bạn luyện tập.",
    questions: "Câu hỏi có sẵn", answered: "Câu đã trả lời",
    loading: "Đang tải các phiên học gần đây…", error: "Chưa tải được các phiên học gần đây.",
    browse: "Khám phá dạng bài", continue: "Tiếp tục luyện tập", progress: "Đã trả lời",
    total: "câu hỏi có sẵn", taskTypes: "dạng bài", viewProgress: "Xem tiến trình",
  },
} as const;
