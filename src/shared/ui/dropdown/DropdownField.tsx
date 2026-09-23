import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { FocusEvent } from "react";
import { createPortal } from "react-dom";
import "./dropdownField.css";

export type DropdownOption<T extends string | number = string> = {
  label: string;
  value: T;
  disabled?: boolean;
};

type DropdownFieldProps<T extends string | number = string> = {
  value?: T;
  options: DropdownOption<T>[];
  placeholder?: string;
  onChange: (value: T) => void;
  disabled?: boolean;
  onBlur?: () => void;
  invalid?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  onSearchChange?: (query: string) => void;
};

type MenuPosition = {
  left: number;
  maxHeight: number;
  placement: "bottom" | "top";
  top: number;
  width: number;
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export function DropdownField<T extends string | number = string>({
  value,
  options,
  placeholder = "Selecione",
  onChange,
  disabled,
  onBlur,
  invalid,
  searchable = true,
  searchPlaceholder = "Buscar...",
  emptyText = "Nenhum resultado",
  onSearchChange,
}: DropdownFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [query, setQuery] = useState("");
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchable) return options;

    const q = normalize(query);
    if (!q) return options;

    return options.filter((option) => normalize(option.label).includes(q));
  }, [options, query, searchable]);

  useEffect(() => {
    if (!open) {
      setQuery(selected?.label ?? "");
      setMenuPosition(null);
    }
  }, [open, selected?.label]);

  useLayoutEffect(() => {
    if (!open) return;

    updateMenuPosition();

    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, filteredOptions.length]);

  useEffect(() => {
    if (!open) return;

    function handleDocumentPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;

      if (
        fieldRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      closeSelect();
    }

    document.addEventListener("pointerdown", handleDocumentPointerDown, true);

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleDocumentPointerDown,
        true
      );
    };
  }, [open, onBlur]);

  function updateMenuPosition() {
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return;

    const viewportHeight = window.innerHeight;
    const viewportWidth = document.documentElement.clientWidth;
    const margin = 6;
    const viewportPadding = 8;
    const preferredMaxHeight = 260;
    const spaceBelow = viewportHeight - rect.bottom - margin - viewportPadding;
    const spaceAbove = rect.top - margin - viewportPadding;
    const placement =
      spaceBelow < 180 && spaceAbove > spaceBelow ? "top" : "bottom";
    const availableSpace = placement === "top" ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(
      120,
      Math.min(preferredMaxHeight, availableSpace)
    );
    const left = Math.min(
      Math.max(rect.left, viewportPadding),
      Math.max(viewportPadding, viewportWidth - rect.width - viewportPadding)
    );

    setMenuPosition({
      left,
      maxHeight,
      placement,
      top: placement === "top" ? rect.top - margin : rect.bottom + margin,
      width: rect.width,
    });
  }

  function openSelect() {
    if (disabled) return;

    setOpen(true);
    if (searchable) {
      setQuery("");
      onSearchChange?.("");
    }

    requestAnimationFrame(() => {
      updateMenuPosition();
      inputRef.current?.focus();
    });
  }

  function closeSelect() {
    setOpen(false);
    onBlur?.();
  }

  function handleWrapperBlur(event: FocusEvent<HTMLDivElement>) {
    if (
      event.currentTarget.contains(event.relatedTarget) ||
      (event.relatedTarget && menuRef.current?.contains(event.relatedTarget))
    ) {
      return;
    }

    closeSelect();
  }

  function selectValue(option: DropdownOption<T>) {
    if (option.disabled) return;

    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
    onBlur?.();
  }

  const menu =
    open && menuPosition && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            className={[
              "df-menu",
              "df-menu--portal",
              `df-menu--${menuPosition.placement}`,
            ].join(" ")}
            role="listbox"
            style={{
              left: menuPosition.left,
              maxHeight: menuPosition.maxHeight,
              top: menuPosition.top,
              width: menuPosition.width,
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="df-emptyText">{emptyText}</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    className={[
                      "df-option",
                      isSelected ? "df-option--selected" : "",
                      option.disabled ? "df-option--disabled" : "",
                    ].join(" ")}
                    disabled={option.disabled}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => selectValue(option)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span>{option.label}</span>
                    {isSelected ? <span className="df-check">✓</span> : null}
                  </button>
                );
              })
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={fieldRef} className="df-field" onBlur={handleWrapperBlur}>
      <div
        className={[
          "df-control",
          disabled ? "df-control--disabled" : "",
          invalid ? "df-control--invalid" : "",
          open ? "df-control--open" : "",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          className="df-search"
          value={query}
          disabled={disabled}
          readOnly={!searchable}
          placeholder={open && searchable ? searchPlaceholder : placeholder}
          onFocus={openSelect}
          onClick={openSelect}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setOpen(true);
            onSearchChange?.(nextQuery);
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete={searchable ? "list" : "none"}
        />

        <button
          className="df-toggle"
          type="button"
          disabled={disabled}
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => {
            if (open) closeSelect();
            else openSelect();
          }}
          aria-label={open ? "Fechar opcoes" : "Abrir opcoes"}
        >
          <span aria-hidden>▾</span>
        </button>
      </div>

      {menu}
    </div>
  );
}
