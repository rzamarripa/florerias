import React from "react";
import { Form } from "react-bootstrap";
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
      borderColor: error ? "#dc3545" : state.isFocused ? "#86b7fe" : "#ced4da",
      boxShadow: state.isFocused
        ? "0 0 0 0.25rem rgba(13, 110, 253, 0.25)"
        : undefined,
      borderRadius: "0.375rem",
      backgroundColor: disabled ? "#e9ecef" : "white",
      "&:hover": {
        borderColor: error
          ? "#dc3545"
          : state.isFocused
          ? "#86b7fe"
          : "#ced4da",
      },
    }),

    multiValue: (base) => ({
      ...base,
      backgroundColor: "rgba(13, 110, 253, 0.1)",
      borderRadius: "0.25rem",
    }),

    multiValueLabel: (base) => ({
      ...base,
      color: "#0d6efd",
      fontSize: "0.875rem",
      fontWeight: "500",
    }),

    multiValueRemove: (base) => ({
      ...base,
      color: "#0d6efd",
      ":hover": {
        backgroundColor: "#0d6efd",
        color: "white",
      },
    }),

    placeholder: (base) => ({
      ...base,
      color: "#6c757d",
    }),

    menu: (base) => ({
      ...base,
      zIndex: 99999,
      borderRadius: "0.375rem",
      boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
      border: "1px solid #dee2e6",
    }),

    menuList: (base) => ({
      ...base,
      maxHeight: maxMenuHeight,
    }),

    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused
        ? "#f8f9fa"
        : state.isSelected
        ? "#e7f1ff"
        : "white",
      color: state.isSelected ? "#0d6efd" : "#212529",
      ":active": {
        backgroundColor: "#e7f1ff",
      },
    }),

    noOptionsMessage: (base) => ({
      ...base,
      color: "#6c757d",
      fontSize: "0.875rem",
    }),

    loadingMessage: (base) => ({
      ...base,
      color: "#6c757d",
      fontSize: "0.875rem",
    }),
  };

  return (
    <div className={className}>
      {label && (
        <Form.Label className="mb-2">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </Form.Label>
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

      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
};

export default MultiSelect;
