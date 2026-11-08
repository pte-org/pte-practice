export const PIP_LAYERS = {
  body: "/mascot/pip-v6/body.png", wing: "/mascot/pip-v6/wing.png",
  lidLeft: "/mascot/pip-v6/lid-left.png", lidRight: "/mascot/pip-v6/lid-right.png",
} as const;

export const PIP_JAW_PATH = "M198 333 Q224 341 254 329 Q267 340 258 355 Q247 372 232 373 Q212 370 202 354 Z";
export const PIP_MESSAGE_DURATION_MS = 3000;
export const PIP_REMINDER_INTERVAL_MS = 30_000;

export const PIP_COPY = {
  en: {
    name: "Meet Pip, your practice buddy",
    action: "Say hello to Pip",
    chatOpened: "The chat box is open. Let's work through your questions together!",
    encouragement: "You've got this! Let's keep learning!",
  },
  vi: {
    name: "Làm quen với Pip, người bạn luyện tập",
    action: "Chào Pip",
    chatOpened: "Chat box đã mở, cùng nhau giải đáp thắc mắc nhé!",
    encouragement: "Cố lên nhé, cùng học nào!",
  },
} as const;
