export interface TaskBriefingInfo {
  formatVi: string;
  formatEn: string;
  tipVi: string;
  tipEn: string;
}

const BRIEFINGS: Record<string, TaskBriefingInfo> = {
  READ_ALOUD: {
    formatVi: "10 câu · ~40s chuẩn bị · 40s đọc",
    formatEn: "10 questions · ~40s prep · 40s speak",
    tipVi: "Đọc to, rõ ràng và tự nhiên. Chú ý phát âm chuẩn âm đuôi và ngắt nghỉ theo cụm nghĩa, không dừng quá 3 giây.",
    tipEn: "Read aloud fluently and naturally. Focus on clear pronunciation, word stress, and avoid pausing for more than 3 seconds.",
  },
  REPEAT_SENTENCE: {
    formatVi: "10 câu · Nghe câu và nói lại",
    formatEn: "10 questions · Listen & repeat",
    tipVi: "Lắng nghe câu mẫu và nhắc lại ngay khi âm thanh kết thúc. Giữ đúng ngữ điệu và tốc độ của người nói.",
    tipEn: "Listen carefully and repeat immediately after audio ends. Match the speaker's intonation and rhythm.",
  },
  DESCRIBE_IMAGE: {
    formatVi: "10 câu · 25s chuẩn bị · 40s nói",
    formatEn: "10 questions · 25s prep · 40s speak",
    tipVi: "Mô tả bức tranh/biểu đồ theo cấu trúc: Giới thiệu chủ đề, 1-2 điểm nổi bật nhất và kết luận. Duy trì giọng nói đều đặn.",
    tipEn: "Describe the image using: overview, 1-2 key highlights, and a conclusion. Maintain a fluent, steady pace.",
  },
  RE_TELL_LECTURE: {
    formatVi: "10 câu · 10s chuẩn bị · 40s nói",
    formatEn: "10 questions · 10s prep · 40s speak",
    tipVi: "Ghi chú nhanh các từ khóa chính khi nghe bài giảng, sau đó tóm tắt lại các ý trọng tâm một cách mạch lạc.",
    tipEn: "Take notes of main ideas while listening, then retell the core concepts clearly in your own words.",
  },
  ANSWER_SHORT_QUESTION: {
    formatVi: "10 câu · Trả lời ngắn",
    formatEn: "10 questions · Short answer",
    tipVi: "Trả lời dứt khoát bằng một hoặc vài từ ngay sau khi âm thanh câu hỏi kết thúc.",
    tipEn: "Answer promptly with one or a few words as soon as the question finishes.",
  },
  RESPOND_TO_A_SITUATION: {
    formatVi: "10 câu · 20s chuẩn bị · 40s nói",
    formatEn: "10 questions · 20s prep · 40s speak",
    tipVi: "Lắng nghe bối cảnh tình huống và đưa ra lời phản hồi tự nhiên, phù hợp với đối tượng giao tiếp.",
    tipEn: "Listen to the situational context and deliver a polite, realistic, and appropriate spoken response.",
  },
  SUMMARIZE_GROUP_DISCUSSION: {
    formatVi: "10 câu · 10s chuẩn bị · 40s nói",
    formatEn: "10 questions · 10s prep · 40s speak",
    tipVi: "Lắng nghe các nhân vật thảo luận và tóm tắt lại sự đồng thuận hoặc quan điểm khác biệt giữa họ.",
    tipEn: "Listen to the discussion and summarize the consensus or contrasting opinions expressed by the speakers.",
  },
  SUMMARIZE_WRITTEN_TEXT: {
    formatVi: "10 câu · 10 phút/câu · 5 - 75 từ",
    formatEn: "10 questions · 10 min/question · 5–75 words",
    tipVi: "Viết duy nhất 1 câu tóm tắt (từ 5 - 75 từ) có đầy đủ chủ vị, bao quát ý chính của văn bản và đúng ngữ pháp.",
    tipEn: "Write a single sentence (5–75 words) that captures the main idea with accurate grammar and punctuation.",
  },
  WRITE_ESSAY: {
    formatVi: "20 phút/bài · 200 - 300 từ",
    formatEn: "20 min/essay · 200–300 words",
    tipVi: "Viết bài luận 200 - 300 từ theo dàn ý chuẩn: Mở bài, 2 đoạn Thân bài phát triển luận điểm và Kết luận.",
    tipEn: "Write a 200–300 word essay with a clear structure: introduction, two body paragraphs, and conclusion.",
  },
  FILL_IN_THE_BLANKS_DROPDOWN: {
    formatVi: "10 câu · Đọc điền từ chọn sẵn",
    formatEn: "10 questions · Reading dropdown",
    tipVi: "Đọc lướt cả câu để hiểu ngữ cảnh, xác định từ loại và ngữ pháp phù hợp trước khi chọn đáp án trong danh sách.",
    tipEn: "Read the whole sentence for context, identify the required part of speech, and select the best fit.",
  },
  MC_READING_MULTIPLE: {
    formatVi: "10 câu · Chọn nhiều đáp án",
    formatEn: "10 questions · Multiple answers",
    tipVi: "Chọn tất cả các đáp án bạn chắc chắn đúng. Lưu ý chọn sai có thể bị trừ điểm nên chỉ chọn khi tự tin.",
    tipEn: "Select only the options you are certain about to avoid negative marking on incorrect selections.",
  },
  RE_ORDER_PARAGRAPHS: {
    formatVi: "10 câu · Sắp xếp đoạn văn",
    formatEn: "10 questions · Re-order paragraphs",
    tipVi: "Tìm câu mở đầu độc lập (không có từ nối/đại từ thay thế), sau đó ghép nối các cặp câu logic tiếp theo.",
    tipEn: "Find the standalone topic sentence first, then link dependent sentences using pronouns and transitions.",
  },
  FILL_IN_THE_BLANKS_DRAG_AND_DROP: {
    formatVi: "10 câu · Kéo thả từ vào chỗ trống",
    formatEn: "10 questions · Drag & drop blanks",
    tipVi: "Xác định từ loại còn thiếu (danh từ, động từ, tính từ) và chọn từ thích hợp trong ngân hàng từ phía dưới.",
    tipEn: "Determine the required part of speech for each blank and drag the correct word from the bank.",
  },
  MC_READING_SINGLE: {
    formatVi: "10 câu · Chọn 1 đáp án",
    formatEn: "10 questions · Single answer",
    tipVi: "Đọc câu hỏi trước để định hướng thông tin cần tìm, sau đó định vị đoạn văn chứa thông tin để chọn đáp án.",
    tipEn: "Read the prompt question first to focus your scan, locate the evidence in the passage, and choose the answer.",
  },
  SUMMARIZE_SPOKEN_TEXT: {
    formatVi: "10 câu · 10 phút/câu · 50 - 70 từ",
    formatEn: "10 questions · 10 min/question · 50–70 words",
    tipVi: "Nghe bài giảng và viết bản tóm tắt 50 - 70 từ. Kiểm tra kỹ giới hạn số từ và chính tả trước khi nộp.",
    tipEn: "Listen and write a 50–70 word summary. Double-check word count, grammar, and spelling before submitting.",
  },
  MC_LISTENING_MULTIPLE: {
    formatVi: "10 câu · Nghe chọn nhiều đáp án",
    formatEn: "10 questions · Multiple choices",
    tipVi: "Đọc nhanh các phương án trong lúc chờ audio, ghi chú lại các ý trùng khớp khi nghe.",
    tipEn: "Skim the options before audio plays, take notes, and select only the options supported by the speaker.",
  },
  FILL_IN_THE_BLANKS_TYPE_IN: {
    formatVi: "10 câu · Nghe điền từ",
    formatEn: "10 questions · Listening type-in",
    tipVi: "Theo dõi con trỏ văn bản theo giọng đọc, gõ từ còn thiếu và kiểm tra lại đuôi số nhiều (-s/-es) hoặc thì quá khứ (-ed).",
    tipEn: "Follow the text with your cursor, type missing words, and verify noun plurals and verb tenses.",
  },
  HIGHLIGHT_CORRECT_SUMMARY: {
    formatVi: "10 câu · Chọn bản tóm tắt đúng",
    formatEn: "10 questions · Correct summary",
    tipVi: "Nắm được thông điệp cốt lõi của bài nói và loại bỏ các phương án chỉ nêu chi tiết phụ hoặc sai lệch.",
    tipEn: "Focus on the primary message of the talk and eliminate options that highlight minor or distorted details.",
  },
  MC_LISTENING_SINGLE: {
    formatVi: "10 câu · Nghe chọn 1 đáp án",
    formatEn: "10 questions · Single choice",
    tipVi: "Đọc kỹ câu hỏi để biết cần nghe thông tin gì (ý chính, thái độ người nói, hay chi tiết cụ thể).",
    tipEn: "Understand what the question asks (main point, speaker tone, or specific detail) before listening.",
  },
  SELECT_MISSING_WORD: {
    formatVi: "10 câu · Chọn từ còn thiếu",
    formatEn: "10 questions · Missing word",
    tipVi: "Chú ý mạch ý của toàn bộ bài nói để dự đoán từ/cụm từ logic nhất thay thế cho tiếng bíp ở cuối.",
    tipEn: "Follow the overarching flow of thoughts to predict the most logical phrase replaced by the final beep.",
  },
  HIGHLIGHT_INCORRECT_WORDS: {
    formatVi: "10 câu · Tìm từ đọc khác văn bản",
    formatEn: "10 questions · Highlight wrong words",
    tipVi: "Dùng chuột di theo từng từ trong khi nghe, bấm ngay vào từ bạn nghe thấy phát âm khác với chữ viết.",
    tipEn: "Move your mouse cursor smoothly along with the speech, clicking any word that differs from what you hear.",
  },
  WRITE_FROM_DICTATION: {
    formatVi: "10 câu · Nghe viết chính tả",
    formatEn: "10 questions · Write from dictation",
    tipVi: "Ghi nhớ nguyên văn cả câu khi nghe, gõ lại chính xác từng từ, viết hoa đầu câu và kết thúc bằng dấu chấm.",
    tipEn: "Memorize the sentence as a meaningful chunk, type verbatim, capitalize the first letter, and add a period.",
  },
};

const DEFAULT_BRIEFING: TaskBriefingInfo = {
  formatVi: "10 câu hỏi / lượt",
  formatEn: "10 questions / session",
  tipVi: "Làm theo hướng dẫn trên màn hình và hoàn thành các câu hỏi để nhận điểm đánh giá chi tiết từ AI.",
  tipEn: "Follow the instructions on screen and answer questions to receive instant, detailed AI feedback.",
};

export function getTaskBriefing(taskCode: string): TaskBriefingInfo {
  return BRIEFINGS[taskCode] ?? DEFAULT_BRIEFING;
}
