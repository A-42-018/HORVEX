import { Bell, BellOff } from "lucide-react";
import { IconButton } from "../../../components/common";
import { playChime, unlockAudio } from "../../../lib/alertSound";
import { strings } from "../../../lib/strings";
import { useOrderAlerts } from "../../../store/orderAlerts";

const t = strings.admin.alerts;
const DOT = { live: "bg-emerald", offline: "bg-amber", connecting: "bg-muted" };

/** Topbar toggle for the new-order sound, with a dot showing the live connection. */
function AlertBell({ status }) {
  const soundOn = useOrderAlerts((state) => state.soundOn);
  const toggleSound = useOrderAlerts((state) => state.toggleSound);
  const Icon = soundOn ? Bell : BellOff;

  function handleClick() {
    toggleSound();
    // This click is the gesture browsers need: unlock audio and preview the chime.
    if (!soundOn) {
      unlockAudio();
      playChime();
    }
  }

  return (
    <>
      <IconButton
        label={soundOn ? t.sound.on : t.sound.off}
        variant="ghost"
        onClick={handleClick}
        aria-describedby="admin-alert-status"
      >
        <Icon aria-hidden="true" size={20} strokeWidth={1.5} />
        <span
          aria-hidden="true"
          className={`absolute right-2.5 top-2.5 h-2 w-2 rounded-full ${DOT[status] ?? DOT.connecting}`}
        />
      </IconButton>
      <span id="admin-alert-status" className="sr-only">
        {t.status[status]}
      </span>
    </>
  );
}

export default AlertBell;
