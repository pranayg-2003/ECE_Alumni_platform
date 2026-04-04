import toast from "react-hot-toast";

/**
 * Normalize API / network failures into a single user-facing string.
 * @param {unknown} error - Axios error or thrown value
 * @param {string} [fallback] - When no message can be extracted
 */
export function getApiErrorMessage(
  error,
  fallback = "Something went wrong. Please try again.",
) {
  if (error == null) return fallback;
  if (typeof error === "string") return error;

  const data = error.response?.data;
  if (data != null && typeof data === "object") {
    if (data.message != null) {
      const m = data.message;
      if (Array.isArray(m)) return m.map(String).join(", ");
      return String(m);
    }
    if (data.error != null) return String(data.error);
  }

  if (error.message === "Network Error") {
    return "Unable to reach the server. Check your connection.";
  }
  if (error.code === "ECONNABORTED") {
    return "Request timed out. Please try again.";
  }

  return fallback;
}

export function toastApiError(error, fallback) {
  toast.error(getApiErrorMessage(error, fallback));
}

export function toastSuccess(message) {
  toast.success(message);
}

export { toast };
