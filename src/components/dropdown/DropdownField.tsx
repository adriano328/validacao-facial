import React, { useEffect, useMemo, useRef, useState } from "react";
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

  // marca touched quando fecha sem selecionar
  onBlur?: () => void;

  invalid?: boolean;

  searchable?: boolean; // default true
  searchPlaceholder?: string;
  emptyText?: string;
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
}: DropdownFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchable) return options;

    const q = normalize(query);
    if (!q) return options;

    return options.filter((opt) => normalize(opt.label).includes(q));
  }, [options, query, searchable]);

  function openModal() {
    if (disabled) return;
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    onBlur?.();
  }

  function selectValue(v: T) {
    onChange(v);
    setOpen(false);
  }

  // limpa busca quando abre
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  // foco no input de busca quando abrir
  useEffect(() => {
    if (open && searchable) {
      // aguarda render
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open, searchable]);

  // fechar com ESC
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // impedir scroll do body com modal aberto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={[
          "df-input",
          disabled ? "df-input--disabled" : "",
          invalid ? "df-input--invalid" : "",
        ].join(" ")}
        onClick={openModal}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={["df-valueText", !selected ? "df-placeholder" : ""].join(" ")}>
          {selected?.label ?? placeholder}
        </span>
        <span className="df-chevron" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div className="df-modal" role="dialog" aria-modal="true">
          <div className="df-backdrop" onClick={closeModal} />

          <div className="df-sheet" ref={sheetRef}>
            <div className="df-sheetHeader">
              <div className="df-sheetTitle">{placeholder}</div>
              <button type="button" className="df-close" onClick={closeModal}>
                Fechar
              </button>
            </div>

            {searchable ? (
              <div className="df-searchWrap">
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="df-searchInput"
                  autoCorrect="off"
                  autoCapitalize="none"
                />
              </div>
            ) : null}

            {filteredOptions.length === 0 ? (
              <div className="df-emptyWrap">
                <div className="df-emptyText">{emptyText}</div>
              </div>
            ) : (
              <ul className="df-list" role="listbox">
                {filteredOptions.map((item) => {
                  const isSelected = item.value === value;
                  const isDisabled = !!item.disabled;

                  return (
                    <li key={String(item.value)} className="df-li">
                      <button
                        type="button"
                        className={[
                          "df-optionRow",
                          isSelected ? "df-optionRow--selected" : "",
                          isDisabled ? "df-optionRow--disabled" : "",
                        ].join(" ")}
                        onClick={() => selectValue(item.value)}
                        disabled={isDisabled}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span
                          className={[
                            "df-optionText",
                            isDisabled ? "df-optionText--disabled" : "",
                          ].join(" ")}
                        >
                          {item.label}
                        </span>
                        {isSelected ? <span className="df-check">✓</span> : null}
                      </button>

                      <div className="df-separator" />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
