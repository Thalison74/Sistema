import type { NavigateFunction } from "react-router-dom";
import { api, errorMessage } from "./tauri";
import { todayIsoDate, nowTime } from "./date";

export async function createSessionAndNavigate(
  navigate: NavigateFunction,
  toast: (message: string, tone?: "success" | "error") => void,
) {
  try {
    const session = await api.sessionCreate({
      session_date: todayIsoDate(),
      session_time: nowTime(),
    });
    navigate(`/sessoes/${session.id}`);
  } catch (err) {
    toast(errorMessage(err), "error");
  }
}
