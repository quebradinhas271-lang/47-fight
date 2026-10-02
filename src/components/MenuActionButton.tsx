import type { ComponentType, ReactNode } from "react";
import { ChevronRight } from "lucide-react";

type MenuActionButtonProps = {
  icon: ComponentType<{ "aria-hidden"?: boolean }>;
  children: ReactNode;
  detail?: ReactNode;
  primary?: boolean;
  selected?: boolean;
  onClick: () => void;
  onHighlight?: () => void;
};

export function MenuActionButton({
  icon: Icon,
  children,
  detail,
  primary = false,
  selected = false,
  onClick,
  onHighlight,
}: MenuActionButtonProps) {
  return (
    <button
      className="ac-cinematic-button"
      data-primary={primary}
      data-selected={selected}
      onClick={onClick}
      onPointerEnter={onHighlight}
      onPointerDown={onHighlight}
      onFocus={onHighlight}
    >
      <span className="ac-cinematic-button__icon">
        <Icon aria-hidden={true} />
      </span>
      <span className="ac-cinematic-button__copy">
        <b>{children}</b>
        {detail && <small>{detail}</small>}
      </span>
      <ChevronRight className="ac-cinematic-button__arrow" aria-hidden="true" />
    </button>
  );
}
