import React from "react";
import { Label } from "@/components/ui/label";
import Select, { MultiValue, StylesConfig } from "react-select";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly [key: string]: any;
}

export interface MultiSelectProps {
  value: string[];
  options: SelectOption[];
  onChange: (values: string[]) => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  noOptionsMessage?: string;
  loadingMessage?: string;
  required?: boolean;
  error?: string;
  isSearchable?: boolean;
  maxMenuHeight?: number;
  className?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  value = [],
  options = [],
  onChange,
  loading = false,
  disabled = false,
  label,
  placeholder = "Select options...",
  noOptionsMessage = "No options found",
  loadingMessage = "Loading...",
  required = false,
  error,
  isSearchable = true,
  maxMenuHeight = 250,
  className = "",
}) => {
  const selectedOptions: SelectOption[] = value
    .map((val) => options.find((opt) => opt.value === val))
    .filter((opt): opt is SelectOption => opt !== undefined);

  const handleChange = (newValue: MultiValue<SelectOption>) => {
    const newValues = (newValue as SelectOption[]).map(
      (option) => option.value
    );
    onChange(newValues);
  };

  const customStyles: StylesConfig<SelectOption, true> = {
    control: (base, state) => ({
      ...base,
      minHeight: "38px",
      borderColor: error ? "#dc3545" : state.isFocused ? "#86b7fe" : "hsl(var(--border))",
      boxShadow: state.isFocused
        ? "0 0 0 0.25rem rgba(13, 110, 253, 0.25)"
        : undefined,
      borderRadius: "0.375rem",
      backgroundColor: disabled ? "hsl(var(--muted))" : "hsl(var(--background))",
      "&:hover": {
        borderColor: error
          ? "#dc3545"
          : state.isFocused
          ? "#86b7fe"
          : "hsl(var(--border))",
      },
    }),

    multiValue: (base) => ({
      ...base,
      backgroundColor: "hsl(var(--background))",
      borderRadius: "0.25rem",
      border: "1px solid hsl(var(--border))",
    }),

    multiValueLabel: (base) => ({
      ...base,
      color: "hsl(var(--foreground))",
      fontSize: "0.875rem",
      fontWeight: "500",
    }),

    multiValueRemove: (base) => ({
      ...base,
      color: "hsl(var(--muted-foreground))",
      ":hover": {
        backgroundColor: "#dc3545",
        color: "white",
      },
    }),

    placeholder: (base) => ({
      ...base,
      color: "hsl(var(--muted-foreground))",
    }),

    menu: (base) => ({
      ...base,
      zIndex: 99999,
      borderRadius: "0.375rem",
      boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
      border: "1px solid hsl(var(--border))",
      backgroundColor: "hsl(var(--background))",
    }),

    menuList: (base) => ({
      ...base,
      maxHeight: maxMenuHeight,
    }),

    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused
        ? "hsl(var(--muted))"
        : state.isSelected
        ? "hsl(var(--primary) / 0.1)"
        : "hsl(var(--background))",
      color: state.isSelected ? "hsl(var(--primary))" : "hsl(var(--foreground))",
      ":active": {
        backgroundColor: "hsl(var(--primary) / 0.1)",
      },
    }),

    noOptionsMessage: (base) => ({
      ...base,
      color: "hsl(var(--muted-foreground))",
      fontSize: "0.875rem",
    }),

    loadingMessage: (base) => ({
      ...base,
      color: "hsl(var(--muted-foreground))",
      fontSize: "0.875rem",
    }),
  };

  return (
    <div className={className}>
      {label && (
        <Label className="mb-2 block">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <Select<SelectOption, true>
        isMulti
        value={selectedOptions}
        onChange={handleChange}
        options={options}
        isLoading={loading}
        isDisabled={disabled}
        isSearchable={isSearchable}
        placeholder={placeholder}
        noOptionsMessage={() => noOptionsMessage}
        loadingMessage={() => loadingMessage}
        styles={customStyles}
        closeMenuOnSelect={false}
        blurInputOnSelect={false}
        hideSelectedOptions={false}
        isClearable={false}
        backspaceRemovesValue={true}
        menuPortalTarget={null}
        menuPosition="absolute"
        menuPlacement="auto"
        classNamePrefix="custom-select"
      />

      {error && <div className="text-destructive text-sm mt-1">{error}</div>}
    </div>
  );
};

export default MultiSelect;
