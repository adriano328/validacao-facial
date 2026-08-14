import { useEffect, useMemo, useRef, useState } from "react";
import type { FocusEvent } from "react";
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
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

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
    }
  }, [open, selected?.label]);

  function openSelect() {
    if (disabled) return;

    setOpen(true);
    if (searchable) {
      setQuery("");
      onSearchChange?.("");
    }

    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function closeSelect() {
    setOpen(false);
    onBlur?.();
  }

  function handleWrapperBlur(event: FocusEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget)) {
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

  return (
    <div className="df-field" onBlur={handleWrapperBlur}>
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
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (open) closeSelect();
            else openSelect();
          }}
          aria-label={open ? "Fechar opcoes" : "Abrir opcoes"}
        >
          <span aria-hidden>▾</span>
        </button>
      </div>

      {open ? (
        <div className="df-menu" role="listbox">
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
                  onMouseDown={(event) => event.preventDefault()}
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
        </div>
      ) : null}
    </div>
  );
}
