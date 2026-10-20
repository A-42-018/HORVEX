import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router";
import { playChime, unlockAudio } from "../../lib/alertSound";
import { subscribeToNewOrders } from "../../services/adminOrderAlerts";
import { queryKeys } from "../../services/queryKeys";
import { useOrderAlerts } from "../../store/orderAlerts";

const isOrdersPage = (pathname) => pathname.startsWith("/admin/orders");

/**
 * Mount once, in AdminLayout. Subscribes to new orders and, for each one: adds an
 * alert card, bumps the Orders badge (unless the orders list is open), plays the
 * chime when sound is on, and refreshes the dashboard and order reads.
 * Returns the connection status: "connecting" | "live" | "offline".
 */
export function useNewOrderAlerts() {
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const [status, setStatus] = useState("connecting");

  // The subscription outlives route changes; it reads the current path here.
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
    // Opening Orders means the new ones have been seen.
    if (isOrdersPage(pathname)) useOrderAlerts.getState().clearUnseen();
  }, [pathname]);

  useEffect(() => {
    let active = true;
    let wasOffline = false;
    const handled = new Set(); // a re-join must not alert for the same order twice

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    };

    const unsubscribe = subscribeToNewOrders({
      onOrder(order) {
        if (handled.has(order.id)) return;
        handled.add(order.id);
        const { push, soundOn } = useOrderAlerts.getState();
        push(order, { countUnseen: !isOrdersPage(pathnameRef.current) });
        if (soundOn) playChime();
        refresh();
      },
      onStatus(next) {
        if (!active) return;
        setStatus(next);
        // Orders placed while the connection was down never arrive as events.
        if (next === "live" && wasOffline) refresh();
        wasOffline = next === "offline";
      },
    });

    // Browsers only allow sound after a gesture; the first one unlocks it.
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      useOrderAlerts.getState().reset(); // nothing outlives the admin session
    };
  }, [queryClient]);

  return status;
}
